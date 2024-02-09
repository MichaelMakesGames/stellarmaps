use logos::Logos;

#[derive(Logos, Debug, PartialEq)]
#[logos(skip r"[ \t\n\f]+")] // Ignore this regex pattern between tokens
pub enum Token<'source> {
	// Tokens can be literal strings, of any length.
	#[token("=")]
	Equals,

	#[token("{")]
	Open,

	#[token("}")]
	Close,

	// from https://stackoverflow.com/a/249937
	#[regex(r#""(?:[^"\\]|\\.)*""#, |lex| {
		let slice = lex.slice();
		return &slice[1..slice.len() - 1];
	})]
	String(&'source str),

	#[regex(r#"[^ \t\n\f={}#"]+"#, |lex| lex.slice())]
	Text(&'source str),

	#[regex("#[^\n]*")]
	Comment,
}

#[cfg(test)]
mod tests {
	use super::*;

	fn assert_tokens(raw_string: &str, expected_tokens: Vec<Token>) {
		let mut lex = Token::lexer(raw_string);
		for token in expected_tokens {
			assert_eq!(lex.next(), Some(Ok(token)));
		}
		assert_eq!(lex.next(), None);
	}

	#[test]
	fn test_string_containing_escaped_quotes() {
		assert_tokens(
			r#"
				foo = "string with \" escaped quote"
			"#,
			vec![
				Token::Text("foo"),
				Token::Equals,
				Token::String(r#"string with \" escaped quote"#),
			],
		);
	}

	#[test]
	fn test_comment() {
		assert_tokens(
			r#"
				foo = FOO # here's a comment
				bar = BAR
			"#,
			vec![
				Token::Text("foo"),
				Token::Equals,
				Token::Text("FOO"),
				Token::Comment,
				Token::Text("bar"),
				Token::Equals,
				Token::Text("BAR"),
			],
		)
	}

	#[test]
	fn test_string_containing_hashtag() {
		assert_tokens(
			r####"
				3hashtags = "###"
			"####,
			vec![
				Token::Text("3hashtags"),
				Token::Equals,
				Token::String("###"),
			],
		)
	}

	#[test]
	fn test_comment_containing_quotes() {
		assert_tokens(
			r####"
				foo = FOO # this is a comment, not a "string"
			"####,
			vec![
				Token::Text("foo"),
				Token::Equals,
				Token::Text("FOO"),
				Token::Comment,
			],
		)
	}
}
