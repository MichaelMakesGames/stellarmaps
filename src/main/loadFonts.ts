import fontList from 'font-list';

export default function loadFonts(): Promise<string[]> {
	return fontList.getFonts({ disableQuoting: true });
}
