import { readable } from 'svelte/store';

import stellarMapsApi from '../../stellarMapsApi';
import type { SelectOption } from '../SelectOption';

export const fontOptions = readable<SelectOption[]>([], (set) => {
	stellarMapsApi
		.loadFonts()
		.then((fonts) =>
			set(fonts.filter((f) => f !== 'Orbitron').map((f) => ({ id: f, literalName: f }))),
		);
});
