import { writable } from 'svelte/store';

export const gameStatePromise = writable<Promise<GameState> | null>(null);
gameStatePromise.subscribe(
	(promise) =>
		promise &&
		promise.then((gameState) => {
			(window as any).gameState = gameState;
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
	sectors: Record<number, Sector>;
	federation: Record<number, Federation>;
	player?: { name: string; country: number }[];
	galaxy: {
		shape: string;
	};
	planets: {
		planet: Record<number, Planet>;
	};
}

export interface GalacticObject {
	name: LocalizedText;
	coordinate: { x: number; y: number; origin: number; randomized: boolean };
	starbases: number[];
	hyperlane?: { to: number; length: number }[] | Record<string, never>;
	megastructures?: number[];
	colonies?: number[];
	bypasses?: number[];
	flags?: Record<string, number | undefined>;
}

export interface Planet {
	name: LocalizedText;
	controller?: number;
	owner?: number;
	num_sapient_pops?: number;
}

export interface Bypass {
	type: string;
	owner?: { type: number; id: number };
	linked_to?: number;
}

export interface Megastructure {
	type: string;
}

export interface Country {
	type: string;
	name?: LocalizedText;
	flag?: {
		colors: string[];
		icon?: {
			category: string;
			file: string;
		};
	};
	capital?: number;
	subjects?: number[];
	overlord?: number;
	federation?: number;
	fleets_manager?: {
		owned_fleets?: { fleet: number }[];
	};
	terra_incognita?: {
		systems?: number[]; // these are explored systems
	};
	relations_manager?: {
		relation?: Relation | Relation[];
	};
	usable_bypasses?: number[];
}

export interface Relation {
	owner: number;
	country: number;
	communications?: boolean;
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

export interface Sector {
	owner?: number;
	local_capital?: number;
	systems: number[];
}

export interface Federation {
	leader: number;
	members: number[];
	name: LocalizedText;
}
