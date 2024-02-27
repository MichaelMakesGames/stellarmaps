import { writable } from 'svelte/store';
import { saveToWindow } from './utils';

const debug = writable(false);
export default debug;
saveToWindow('debug', debug);
