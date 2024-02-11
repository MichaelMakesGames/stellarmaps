export function tokenize(gameState: string): string[] {
	const tokens: string[] = [];
	let token: string | null = null;
	let quoteOpen = false;
	let comment = false;
	for (const char of gameState) {
		if (comment) {
			if (char === '\n') {
				comment = false;
			}
		} else if (token != null && quoteOpen) {
			token = token.concat(char);
			if (char === '"') {
				tokens.push(token);
				token = null;
				quoteOpen = false;
			}
		} else if (char === '#') {
			if (token != null) tokens.push(token);
			token = null;
			comment = true;
		} else if (char.match(/\s/)) {
			if (token != null) tokens.push(token);
			token = null;
		} else if (char === '{' || char === '}' || char === '=') {
			if (token != null) tokens.push(token);
			token = null;
			tokens.push(char);
		} else if (char === '"') {
			token = char;
			quoteOpen = true;
		} else {
			if (token != null) {
				token = token.concat(char);
			} else {
				token = char;
			}
		}
	}
	return tokens;
}

const ARRAY_KEY = '___array___';

export function jsonify(tokens: string[]): Record<string, any> {
	const gameState: Record<string, any> = {};
	const stack: Record<string, any>[] = [];
	let current = gameState;
	let key: string | null = null;
	let assigning = false;
	for (const token of tokens) {
		if (token === '{') {
			if (assigning) {
				if (key != null) {
					const newObject = {};
					const strippedKey = stripQuotes(key);
					if (current[strippedKey] != undefined) {
						if (!Array.isArray(current[strippedKey])) {
							current[strippedKey] = [current[strippedKey]];
						}
						current[strippedKey].push(newObject);
					} else {
						current[strippedKey] = newObject;
					}
					stack.push(current);
					current = newObject;
					key = null;
					assigning = false;
				} else {
					console.error('assign new object, but no current key', current);
					return gameState;
				}
			} else {
				if (key != null) {
					assignToArray(current, parseValue(key));
					key = null;
				}
				const newObject = {};
				assignToArray(current, newObject);
				stack.push(current);
				current = newObject;
			}
		} else if (token === '}') {
			if (assigning) {
				console.error('closing object, but currently assigning', current);
				return gameState;
			} else {
				if (key != null) {
					assignToArray(current, parseValue(key));
					key = null;
				}
				if (Object.keys(current).length === 1 && Object.keys(current)[0] === ARRAY_KEY) {
					// special case to unwrap arrays
					const array = current[ARRAY_KEY];
					current = stack.pop() ?? {};
					const arrayKey = Object.keys(current).find((key) => current[key][ARRAY_KEY] === array);
					if (arrayKey != null) current[arrayKey] = array;
				} else {
					current = stack.pop() ?? {};
				}
			}
		} else if (token === '=') {
			if (assigning) {
				console.error('already assigning', key, current);
				return gameState;
			} else if (key != null) {
				assigning = true;
			} else {
				console.error('no key to assign', current);
				return gameState;
			}
		} else {
			if (assigning && key != null) {
				const strippedKey = stripQuotes(key);
				if (current[strippedKey] != undefined) {
					if (!Array.isArray(current[strippedKey])) {
						current[strippedKey] = [current[strippedKey]];
					}
					current[strippedKey].push(parseValue(token));
				} else {
					current[strippedKey] = parseValue(token);
				}
				key = null;
				assigning = false;
			} else if (key != null) {
				assignToArray(current, parseValue(key));
				key = token;
			} else {
				key = token;
			}
		}
	}
	return gameState;
}

function stripQuotes(s: string) {
	if (s.startsWith('"') && s.endsWith('"')) return s.substring(1, s.length - 1);
	return s;
}
function assignToArray(obj: any, value: any) {
	if (obj[ARRAY_KEY] == null) obj[ARRAY_KEY] = [];
	obj[ARRAY_KEY].push(value);
}
function parseValue(token: string): string | number | boolean {
	if (token === 'no') return false;
	if (token === 'yes') return true;
	const n = Number.parseFloat(token);
	if (!Number.isNaN(n)) return n;
	return stripQuotes(token);
}
