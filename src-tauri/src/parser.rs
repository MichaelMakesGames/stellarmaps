use crate::lexer::Token;
use anyhow;
use logos::{Lexer, Logos};
use serde_json::{Map, Number, Value};

pub fn parse(string: &str, filter: &Value) -> anyhow::Result<Value> {
	let mut lex = Token::lexer(string);
	return parse_object(&mut lex, filter);
}

fn parse_object<'source>(
	lex: &mut Lexer<'source, Token<'source>>,
	filter: &Value,
) -> anyhow::Result<Value> {
	let mut map = Map::new();
	let mut items = vec![];
	let mut duplicated_keys = vec![];

	let mut assigning = false;
	let mut key = None;
	let mut value = None;

	let mut token = lex.next();
	while token != None && token != Some(Ok(Token::Close)) {
		match token {
			Some(Ok(Token::Text(s))) | Some(Ok(Token::String(s))) => {
				if assigning {
					value = Some(Value::String(String::from(s)));
					assigning = false;
				} else {
					if key.is_some() && value.is_some() {
						insert_val(key, value, &mut map, &mut duplicated_keys, filter);
						value = None;
					} else if key.is_some() {
						items.push(Value::String(key.unwrap()));
					}
					key = Some(String::from(s))
				}
			}
			Some(Ok(Token::Equals)) => {
				if key.is_none() {
					anyhow::bail!("Unexpected token =");
				} else if value.is_some() {
					// we've encountered a key without a value, eg
					// key1 =
					// key2 = val2
					// in the above example, key current contains key1 and val contains key2
					// we need to save key1 as null, then move val to key
					insert_val(
						key,
						Some(Value::Null),
						&mut map,
						&mut duplicated_keys,
						filter,
					);
					key = Some(value.unwrap().as_str().unwrap().to_string());
					value = None;
				}
				if !is_key_included(&key.to_owned().unwrap(), filter) {
					key = None;
					let skipped_str = skip_value(lex)?;
					token = lex.next();
					if let Some(Ok(Token::Equals)) = token {
						// the skipped key had no value (eg "skipped = "), so the skipped token is actually the next key
						if let Some(skipped_key) = skipped_str {
							key = Some(String::from(skipped_key));
						}
					}
					continue; // already called lex.next() to check for the above edge-case
				} else {
					assigning = true;
				}
			}
			Some(Ok(Token::Comment)) => (),
			Some(Ok(Token::Open)) => {
				if assigning {
					let next_filter = if is_key_array(key.as_ref().unwrap(), filter) {
						get_next_filter_array(get_next_filter(key.as_ref().unwrap(), filter))
					} else {
						get_next_filter(key.as_ref().unwrap(), filter)
					};
					insert_val(
						key,
						Some(parse_object(lex, next_filter)?),
						&mut map,
						&mut duplicated_keys,
						filter,
					);
					key = None;
					assigning = false;
				} else {
					if key.is_some() && value.is_some() {
						insert_val(key, value, &mut map, &mut duplicated_keys, filter);
						key = None;
						value = None;
					} else if key.is_some() {
						items.push(Value::String(key.unwrap()));
						key = None
					}
					items.push(parse_object(lex, get_next_filter_array(filter))?);
				}
			}
			Some(e @ Err(_)) => anyhow::bail!("Lexing error: {:#?}", e),
			Some(Ok(Token::Close)) => panic!("This should not be reachable!"),
			None => panic!("TODO"),
		}
		token = lex.next();
	}
	if key.is_some() && value.is_some() {
		insert_val(key, value, &mut map, &mut duplicated_keys, filter);
	} else if key.is_some() && value.is_none() && !assigning {
		items.push(Value::String(key.unwrap()));
	} else if key.is_some() && value.is_none() && assigning {
		insert_val(
			key,
			Some(Value::Null),
			&mut map,
			&mut duplicated_keys,
			filter,
		);
	}

	if map.is_empty() && !items.is_empty() {
		return Ok(Value::Array(items.into_iter().map(parse_value).collect()));
	} else if items.is_empty() {
		if !duplicated_keys.is_empty() {
			map.insert(
				String::from("$duplicatedKeys"),
				Value::Array(duplicated_keys),
			);
		}
		map.retain(|_k, v| !v.is_null());
		return Ok(Value::Object(map));
	} else {
		anyhow::bail!("Parsing error: mixed map and array");
	}
}

fn parse_value(value: Value) -> Value {
	if value.is_string() {
		let s = value.as_str().unwrap();
		if s == "yes" {
			return Value::Bool(true);
		} else if s == "no" {
			return Value::Bool(false);
		} else if s == "none" {
			return Value::Null;
		} else if let Ok(n) = s.parse::<u64>() {
			return Value::Number(Number::from(n));
		} else if let Ok(n) = s.parse::<f64>() {
			return Value::Number(Number::from_f64(n).unwrap());
		} else {
			return value;
		}
	} else {
		return value;
	}
}

fn skip_value<'source>(
	lex: &mut Lexer<'source, Token<'source>>,
) -> anyhow::Result<Option<&'source str>> {
	let mut token = lex.next();
	let mut depth: u8 = 0;
	while token != None {
		match token {
			Some(Ok(Token::Text(s))) | Some(Ok(Token::String(s))) => {
				if depth == 0 {
					return Ok(Some(s));
				}
			}
			Some(Ok(Token::Equals)) => {
				if depth == 0 {
					anyhow::bail!("Unexpected token: =")
				}
			}
			Some(Ok(Token::Comment)) => (),
			Some(Ok(Token::Open)) => {
				depth += 1;
			}
			Some(Ok(Token::Close)) => {
				if depth == 0 {
					anyhow::bail!("Unexpected token: }}")
				} else if depth == 1 {
					return Ok(None);
				} else {
					depth -= 1;
				}
			}
			Some(e @ Err(_)) => anyhow::bail!("Lexing error: {:#?}", e),
			None => panic!("This should not be reachable"),
		}
		token = lex.next();
	}
	return Ok(None);
}

fn insert_val(
	key: Option<String>,
	value: Option<Value>,
	map: &mut Map<String, Value>,
	duplicated_keys: &mut Vec<Value>,
	filter: &Value,
) {
	let k: String = key.unwrap();
	if is_key_array(&k, filter) {
		if map.contains_key(&k) {
			map
				.get_mut(&k)
				.unwrap()
				.as_array_mut()
				.unwrap()
				.push(parse_value(value.unwrap()))
		} else {
			let value = parse_value(value.unwrap());
			// there's likely an edge-case here with nested arrays
			if value.is_array() {
				map.insert(k, value);
			} else {
				map.insert(k, Value::Array(vec![value]));
			}
		}
	} else {
		if map.contains_key(&k) {
			duplicated_keys.push(Value::String(k.clone()));
		}
		map.insert(k, parse_value(value.unwrap()));
	}
}

fn is_key_included(key: &String, filter: &Value) -> bool {
	return (filter.is_boolean() && filter.as_bool().unwrap())
		|| (filter.is_object()
			&& (filter.as_object().unwrap().contains_key(key)
				|| filter.as_object().unwrap().contains_key("*")));
}

fn is_key_array(key: &String, filter: &Value) -> bool {
	return filter.is_object()
		&& filter
			.as_object()
			.unwrap()
			.get(key)
			.unwrap_or(&Value::Null)
			.is_array();
}

fn get_next_filter<'a>(key: &String, filter: &'a Value) -> &'a Value {
	if filter.is_boolean() {
		return filter;
	} else if filter.is_object() {
		let object = filter.as_object().unwrap();
		if let Some(val) = object.get(key) {
			return &val;
		} else if let Some(val) = object.get("*") {
			return &val;
		} else {
			return &Value::Bool(false);
		}
	} else {
		return &Value::Bool(false);
	};
}

fn get_next_filter_array<'a>(filter: &'a Value) -> &'a Value {
	if filter.is_boolean() || filter.is_object() {
		return filter;
	} else if filter.is_array() {
		let array = filter.as_array().unwrap();
		if let Some(val) = array.get(0) {
			return &val;
		} else {
			return &Value::Bool(false);
		}
	} else {
		return &Value::Bool(false);
	};
}

#[cfg(test)]
mod tests {
	use super::*;
	use serde_json::json;

	fn parse_full(string: &str) -> anyhow::Result<Value> {
		return parse(string, &Value::Bool(true));
	}

	#[test]
	fn test_basic_map() {
		let actual = parse_full("foo = bar").unwrap();
		let expected = json!({ "foo": "bar" });
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_basic_map_with_string_value() {
		let actual = parse_full(r#"foo = "bar""#).unwrap();
		let expected = json!({ "foo": "bar" });
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_basic_map_with_string_key() {
		let actual = parse_full(r#""foo" = bar"#).unwrap();
		let expected = json!({ "foo": "bar" });
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_basic_map_with_multiple_key_vals() {
		let actual = parse_full(r#"foo = bar baz = bax"#).unwrap();
		let expected = json!({ "foo": "bar", "baz": "bax" });
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_basic_map_with_unassigned_keys() {
		let actual = parse_full(
			r#"
				foo = FOO
				bar =
				baz = BAZ
				bax =
			"#,
		)
		.unwrap();
		let expected = json!({
			"foo": "FOO",
			"baz": "BAZ",
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_assignment_with_no_keys_fails() {
		let actual = parse_full("= value");
		assert!(actual.is_err());
	}

	#[test]
	fn test_simple_nested_map() {
		let actual = parse_full(
			r#"
				foo = {
					0 = f
					1 = o
					2 = o
				}
			"#,
		)
		.unwrap();
		let expected = json!({
			"foo": {
				"0": "f",
				"1": "o",
				"2": "o"
			}
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_complex_nested_map() {
		let actual = parse_full(
			r#"
				bar = BAR
				foo = {
					0 = f
					1 = o
					2 = o
					capsArray = { F O O }
					caps = FOO
				}
			"#,
		)
		.unwrap();
		let expected = json!({
			"bar": "BAR",
			"foo": {
				"0": "f",
				"1": "o",
				"2": "o",
				"capsArray": ["F", "O", "O"],
				"caps": "FOO"
			}
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_array_basic() {
		let actual = parse_full(r#"foo bar"#).unwrap();
		let expected = json!(["foo", "bar"]);
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_array_of_objects() {
		let actual = parse_full(r#"{foo=FOO}{bar=BAR}"#).unwrap();
		let expected = json!([{ "foo": "FOO" }, { "bar": "BAR" }]);
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_array_mixed() {
		let actual = parse_full(r#"1 two { three = THREE } { 4 four FOUR }"#).unwrap();
		let expected = json!([1, "two", { "three": "THREE" }, [4, "four", "FOUR"]]);
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_mixed_array_and_map_fails() {
		let actual = parse_full("1 2 3 foo = FOO 4 5 6");
		assert!(actual.is_err());
	}

	#[test]
	fn test_duplicate_keys_metadata() {
		let actual = parse_full(
			r#"
				foo = 1
				foo = 2
				foo = 3
				bar = {
					b = b
					b = b
				}
			"#,
		)
		.unwrap();
		let expected = json!({
			"foo": 3,
			"$duplicatedKeys": ["foo", "foo"],
			"bar": {
				"b": "b",
				"$duplicatedKeys": ["b"]
			}
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter() {
		let actual = parse(
			r#"
				foo = FOO
				bar = BAR
				baz = BAZ
				bax = BAX
			"#,
			&json!({ "foo": true, "baz": true }),
		)
		.unwrap();
		let expected = json!({
			"foo": "FOO",
			"baz": "BAZ",
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter_with_unassigned_keys() {
		let actual = parse(
			r#"
				foo =
				bar =
				baz = BAZ
				bax =
			"#,
			&json!({ "foo": true, "baz": true }),
		)
		.unwrap();
		let expected = json!({
			"baz": "BAZ",
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter_with_complex_map() {
		let actual = parse(
			r#"
				foo = { deeply = { nested = { even = deeper } } }
				bar = { also = { deeply = nested } }
			"#,
			&json!({
				"bar": { "notAlso": true }
			}),
		)
		.unwrap();
		let expected = json!({
			"bar": {}
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter_with_arrays() {
		let actual = parse(
			r#"
				foo = { 1 2 3 }
				bar = { 4 5 6 }
				baz = {
					{ upper = B lower = b }
					{ upper = A lower = a }
					{ upper = Z lower = z }
				}
				bax = { this will be skipped }
			"#,
			&json!({
				"foo": true,
				"bar": [],
				"baz": [{ "upper": true }]
			}),
		)
		.unwrap();
		let expected = json!({
			"foo": [1, 2, 3],
			"bar": [4, 5, 6],
			"baz": [
				{ "upper": "B" },
				{ "upper": "A" },
				{ "upper": "Z" }
			]
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter_with_wildcard() {
		let actual = parse(
			r#"
				1 = { digit = 1 word = One }
				2 = { digit = 2 word = Two }
				3 = { digit = 3 word = Three }
			"#,
			&json!({
				"*": { "word": true }
			}),
		)
		.unwrap();
		let expected = json!({
			"1": { "word": "One" },
			"2": { "word": "Two" },
			"3": { "word": "Three" },
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_filter_array_coercion() {
		let actual = parse(
			r#"
				foo = { i = 1 iword = one }
				foo = { i = 2 iword = two }
				bar = BAR
			"#,
			&json!({
				"foo": [{ "i": true }],
				"bar": [],
			}),
		)
		.unwrap();
		let expected = json!({
			"foo": [{ "i": 1 }, { "i": 2 }],
			"bar": ["BAR"]
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_parses_numbers_and_bools() {
		let actual = parse_full(
			r#"
				one = 1
				decimal = 1.23
				true = yes
				false = no
				array = { 1 1.23 yes no }
			"#,
		)
		.unwrap();
		let expected = json!({
			"one": 1,
			"decimal": 1.23,
			"true": true,
			"false": false,
			"array": [1, 1.23, true, false]
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_parses_drop_null_values() {
		let actual = parse_full(
			r#"
				notnull = foo
				null = none
				implicit_null =
				array = { notnull none }
			"#,
		)
		.unwrap();
		let expected = json!({
			"notnull": "foo",
			"array": ["notnull", null]
		});
		assert_eq!(actual, expected);
	}

	#[test]
	fn test_comments() {
		let actual = parse_full(
			r#"
				foo = { 1 2 3 } # here's a comment
				bar = { 4 5 6 }
				# here's a comment on its own line
				baz = {
					{ upper = B lower = b }
					{ upper = A lower = a }
					# here's a nested comment
					{ upper = Z lower = z }
				}
			"#,
		)
		.unwrap();
		let expected = json!({
			"foo": [1, 2, 3],
			"bar": [4, 5, 6],
			"baz": [
				{ "upper": "B", "lower": "b" },
				{ "upper": "A", "lower": "a" },
				{ "upper": "Z", "lower": "z" }
			]
		});
		assert_eq!(actual, expected);
	}
}
