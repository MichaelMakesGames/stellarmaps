import { derived } from 'svelte/store';

import { ADDITIONAL_COLORS } from '../../colors';
import { stellarisDataPromiseStore } from '../../loadStellarisData';
import type { SelectOption } from '../SelectOption';

export const colorDynamicOptions = derived<typeof stellarisDataPromiseStore, SelectOption[]>(
	stellarisDataPromiseStore,
	(stellarisDataPromise, set) => {
		stellarisDataPromise.then(({ colors }) =>
			set(
				Object.keys(colors).map((c) => ({
					id: c,
					group:
						c in ADDITIONAL_COLORS
							? 'option.color.group.stellar_maps'
							: 'option.color.group.stellaris',
					literalName: c
						.split('_')
						.filter((word) => word.length > 0)
						.map((word) => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`)
						.join(' '),
				})),
			),
		);
	},
	[],
);
