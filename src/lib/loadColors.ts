import { invoke } from '@tauri-apps/api';
import { jsonify, tokenize } from './parseSave';

export default async function loadColors() {
	const rawContent = await invoke('read_stellaris_colors');
	const parsed = jsonify(tokenize(rawContent as string)) as Record<
		string,
		{ color: [number, number, number, number] }
	>;
	return Object.fromEntries(
		Object.entries(parsed).map(([key, value]) => [
			key,
			`rgba(${value.color[0]}, ${value.color[1]}, ${value.color[2]}, ${value.color[3] / 255})`
		])
	);
}
