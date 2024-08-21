import { readable } from 'svelte/store';

import type { SelectOption } from '../SelectOption';

export const emptyOptions = readable<SelectOption[]>([]);
