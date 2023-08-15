export interface GameState {
	galactic_object: Record<number, GalacticObject>;
	country: Record<number, Country>;
	ships: Record<number, Ship>;
	fleet: Record<number, Fleet>;
	starbase_mgr: { starbases: Record<number, Starbase> };
}

export interface GalacticObject {
	coordinate: { x: number; y: number; origin: number; randomized: boolean };
	starbases: number[];
}

export interface Country {
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
