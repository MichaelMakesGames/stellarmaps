import { writable } from 'svelte/store';

import type { SelectOption } from '../SelectOption';

export const speciesOptions = writable<SelectOption[]>([]);
