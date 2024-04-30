import { writable } from 'svelte/store';
import type { SelectOption } from '../SelectOption';

export const countryOptions = writable<SelectOption[]>([]);
