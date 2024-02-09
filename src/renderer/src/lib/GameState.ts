import { writable } from 'svelte/store';
import { z } from 'zod';
import { saveToWindow } from './utils';

export const gameStatePromise = writable<Promise<GameState> | null>(null);
gameStatePromise.subscribe(
	(promise) =>
		promise &&
		promise.then((gameState) => {
			saveToWindow('gameState', gameState);
		}),
);

// zod can't infer recursive types
export interface LocalizedText {
	key: string;
	variables?: {
		key: string;
		value: LocalizedText;
	}[];
}
const localizedTextSchema: z.ZodType<LocalizedText> = z.object({
	key: z.coerce.string(),
	variables: z
		.array(
			z.object({
				key: z.coerce.string(),
				value: z.lazy(() => localizedTextSchema),
			}),
		)
		.optional(),
});

const galacticObjectSchema = z.object({
	name: localizedTextSchema,
	coordinate: z.object({
		x: z.number(),
		y: z.number(),
	}),
	starbases: z.array(z.number()),
	hyperlane: z.array(z.object({ to: z.number(), length: z.number() })).optional(),
	megastructures: z.array(z.number()).optional(),
	colonies: z.array(z.number()).optional(),
	bypasses: z.array(z.number()).optional(),
	flags: z
		.record(
			z.string(),
			z.union([z.number().optional(), z.object({ flag_date: z.number(), flag_days: z.number() })]),
		)
		.optional(),
});
export type GalacticObject = z.infer<typeof galacticObjectSchema>;

const planetSchema = z.object({
	name: localizedTextSchema,
	controller: z.number().optional(),
	owner: z.number().optional(),
	num_sapient_pops: z.number().optional(),
});
export type Planet = z.infer<typeof planetSchema>;

const bypassSchema = z.object({
	type: z.string(),
	owner: z.object({ type: z.number(), id: z.number() }).optional(),
	linked_to: z.number().optional(),
});
export type Bypass = z.infer<typeof bypassSchema>;

const megastructureSchema = z.object({
	type: z.string(),
});
export type Megastructure = z.infer<typeof megastructureSchema>;

const relationSchema = z.object({
	owner: z.number(),
	country: z.number(),
	communications: z.boolean().optional(),
});
export type Relation = z.infer<typeof relationSchema>;

const countrySchema = z.object({
	type: z.string(),
	name: localizedTextSchema,
	flag: z
		.object({
			colors: z.array(z.string()),
			icon: z
				.object({
					category: z.string(),
					file: z.string(),
				})
				.optional(),
		})
		.optional(),
	capital: z.number().optional(),
	subjects: z.array(z.number()).optional(),
	overlord: z.number().optional(),
	federation: z.number().optional(),
	usable_bypasses: z.array(z.number()).default([]),
	fleets_manager: z
		.object({
			owned_fleets: z.array(z.object({ fleet: z.number() })).optional(),
		})
		.optional(),
	terra_incognita: z
		.object({
			systems: z.array(z.number()).optional(),
		})
		.optional(),
	relations_manager: z.object({ relation: z.array(relationSchema).optional() }).optional(),
});
export type Country = z.infer<typeof countrySchema>;

const starbaseSchema = z.object({
	station: z.number(),
});
export type Starbase = z.infer<typeof starbaseSchema>;

const shipSchema = z.object({
	fleet: z.number(),
});
export type Ship = z.infer<typeof shipSchema>;

const fleetSchema = z.object({
	station: z.boolean().optional(),
});
export type Fleet = z.infer<typeof fleetSchema>;

const sectorSchema = z.object({
	owner: z.number().optional(),
	local_capital: z.number().optional(),
	systems: z.array(z.number()),
});
export type Sector = z.infer<typeof sectorSchema>;

const federationSchema = z.object({
	leader: z.number(),
	members: z.array(z.number()),
	name: localizedTextSchema,
});
export type Federation = z.infer<typeof federationSchema>;

function stellarisDb<T extends z.ZodType>(schema: T) {
	return z.record(z.coerce.number(), schema).default({});
}

export const gameStateSchema = z.object({
	galactic_object: stellarisDb(galacticObjectSchema),
	country: stellarisDb(countrySchema),
	ships: stellarisDb(shipSchema),
	fleet: stellarisDb(fleetSchema),
	starbase_mgr: z.object({ starbases: stellarisDb(starbaseSchema) }).default({ starbases: {} }),
	bypasses: stellarisDb(bypassSchema),
	megastructures: stellarisDb(megastructureSchema),
	sectors: stellarisDb(sectorSchema),
	federation: stellarisDb(federationSchema),
	player: z.array(z.object({ name: z.string(), country: z.number() })).optional(),
	galaxy: z.object({ shape: z.string() }),
	planets: z.object({ planet: stellarisDb(planetSchema) }).default({}),
});
export type GameState = z.infer<typeof gameStateSchema>;

function convertSchemaToGameStateFilter(schema: z.ZodType): boolean | Record<string, any> | any[] {
	if (schema === localizedTextSchema) {
		return true;
	} else if (schema instanceof z.ZodDefault) {
		return convertSchemaToGameStateFilter(schema.removeDefault());
	} else if (schema instanceof z.ZodOptional) {
		return convertSchemaToGameStateFilter(schema.unwrap());
	} else if (schema instanceof z.ZodNullable) {
		return convertSchemaToGameStateFilter(schema.unwrap());
	} else if (schema instanceof z.ZodUnion) {
		const unionPaths = (schema.options as z.ZodType[]).map((option) =>
			convertSchemaToGameStateFilter(option),
		);
		const complexUnionPaths = unionPaths.filter((p) => typeof p !== 'boolean');
		if (unionPaths.includes(true)) return true;
		if (complexUnionPaths.length === 1) return complexUnionPaths[0];
		if (complexUnionPaths.length > 1) {
			console.error('complex union, falling back to true');
			return true;
		}
		return false;
	} else if (schema instanceof z.ZodObject) {
		return Object.fromEntries(
			Object.entries(schema.shape).map(([key, value]) => [
				key,
				convertSchemaToGameStateFilter(value as z.ZodType),
			]),
		);
	} else if (schema instanceof z.ZodArray) {
		return [convertSchemaToGameStateFilter(schema.element)];
	} else if (schema instanceof z.ZodRecord) {
		return { '*': convertSchemaToGameStateFilter(schema.valueSchema) };
	} else {
		return false;
	}
}
export const gameStateFilter = convertSchemaToGameStateFilter(gameStateSchema);
