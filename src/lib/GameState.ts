import { writable } from 'svelte/store';

export const gameStatePromise = writable<Promise<GameState> | null>(null);
gameStatePromise.subscribe(
	(promise) =>
		promise &&
		promise.then((gameState) => {
			(window as any).gameState = gameState; // eslint-disable-line
		}),
);

export interface GameState {
	galactic_object: Record<number, GalacticObject>;
	country: Record<number, Country>;
	ships: Record<number, Ship>;
	fleet: Record<number, Fleet>;
	starbase_mgr: { starbases: Record<number, Starbase> };
	bypasses: Record<number, Bypass>;
	megastructures: Record<number, Megastructure>;
}

export interface GalacticObject {
	coordinate: { x: number; y: number; origin: number; randomized: boolean };
	starbases: number[];
	hyperlane?: { to: number; length: number }[];
	megastructures?: number[];
}

export interface Bypass {
	type: string;
	owner?: { type: number; id: number };
}

export interface Megastructure {
	type: string;
}

export interface Country {
	name?: LocalizedText;
	flag: { colors: string[] };
	fleets_manager?: {
		owned_fleets?: { fleet: number }[];
	};
}
export interface Starbase {
	station: number;
}

export interface Ship {
	fleet: number;
}

export interface Fleet {
	station: boolean;
}

export interface LocalizedText {
	key: string;
	variables?: {
		key: string;
		value: LocalizedText;
	}[];
}
