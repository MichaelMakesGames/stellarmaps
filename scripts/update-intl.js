import { hfs } from '@humanfs/node';
import * as prettier from 'prettier';

const langs = ['fi-FI', 'ja-JP', 'zh-TW'];
let text = await hfs.text('./src/renderer/src/intl/en-US.ts');
let messages = {};
eval(text.replace('export default', 'messages ='));
const comments = text
	.split('\n')
	.map((line) => line.trim())
	.map((line, i) => {
		const commentStart = line.indexOf('//');
		if (commentStart !== -1) {
			const content = line.substring(commentStart + 2);
			const isWholeLine = commentStart === 0;
			return { content, isWholeLine, i };
		}
	})
	.filter(Boolean);
for (const lang of langs) {
	const path = `./src/renderer/src/intl/${lang}.ts`;
	const mergedMessages = structuredClone(messages);
	const translationText = await hfs.text(path);
	let translationMessages = {};
	eval(translationText.replace('export default', 'translationMessages ='));
	mergeMessages(mergedMessages, translationMessages);
	const mergedText = `export default ${messagesToText(mergedMessages)}`;
	const prettierOptions = await prettier.resolveConfig(path);
	const formatted = await prettier.format(mergedText, { ...prettierOptions, parser: 'typescript' });
	const formattedLines = formatted.split('\n');
	for (const comment of comments) {
		if (comment.isWholeLine) {
			formattedLines.splice(comment.i, 0, `//${comment.content}`);
		} else {
			formattedLines[comment.i] = `${formattedLines[comment.i]} //${comment.content}`;
		}
	}
	const formattedWithComments = await prettier.format(formattedLines.join('\n'), {
		...prettierOptions,
		parser: 'typescript',
	});
	await hfs.write(path, formattedWithComments);
}

function mergeMessages(mergedMessages, translationMessages) {
	for (const key of Object.keys(mergedMessages)) {
		if (typeof mergedMessages[key] === 'string' && typeof translationMessages[key] === 'string') {
			mergedMessages[key] = translationMessages[key];
		} else if (
			typeof mergedMessages[key] === 'object' &&
			typeof translationMessages[key] === 'object'
		) {
			mergeMessages(mergedMessages[key], translationMessages[key]);
		}
	}
}

function messagesToText(messages) {
	return `{
		${Object.entries(messages)
			.map(([key, value]) => {
				if (typeof value === 'object') {
					return `${key}:${messagesToText(value)}`;
				} else if (value.includes('\n')) {
					return `${key}:\`${value}\``;
				} else {
					return `${key}:'${value}'`;
				}
			})
			.join(',')}
	}`;
}
