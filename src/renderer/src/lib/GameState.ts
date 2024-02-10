import { writable } from 'svelte/store';
import { z } from 'zod';
import { saveToWindow } from './utils';

type WithId<T> = T & { id: number };

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
	// TODO coerced array
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
export type GalacticObject = WithId<z.infer<typeof galacticObjectSchema>>;

const planetSchema = z.object({
	name: localizedTextSchema,
	controller: z.number().optional(),
	owner: z.number().optional(),
	num_sapient_pops: z.number().optional(),
});
export type Planet = WithId<z.infer<typeof planetSchema>>;

const bypassSchema = z.object({
	type: z.string(),
	owner: z.object({ type: z.number(), id: z.number() }).optional(),
	linked_to: z.number().optional(),
});
export type Bypass = WithId<z.infer<typeof bypassSchema>>;

const megastructureSchema = z.object({
	type: z.string(),
});
export type Megastructure = WithId<z.infer<typeof megastructureSchema>>;

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
	relations_manager: z
		.object({
			// TODO coerced array
			relation: z.array(relationSchema).optional(),
		})
		.optional(),
});
export type Country = WithId<z.infer<typeof countrySchema>>;

const starbaseSchema = z.object({
	station: z.number(),
});
export type Starbase = WithId<z.infer<typeof starbaseSchema>>;

const shipSchema = z.object({
	fleet: z.number(),
});
export type Ship = WithId<z.infer<typeof shipSchema>>;

const fleetSchema = z.object({
	station: z.boolean().optional(),
});
export type Fleet = WithId<z.infer<typeof fleetSchema>>;

const sectorSchema = z.object({
	owner: z.number().optional(),
	local_capital: z.number().optional(),
	systems: z.array(z.number()),
});
export type Sector = WithId<z.infer<typeof sectorSchema>>;

const federationSchema = z.object({
	leader: z.number(),
	members: z.array(z.number()),
	name: localizedTextSchema,
});
export type Federation = WithId<z.infer<typeof federationSchema>>;

function addIds<T>(db: Record<number, T>): Record<number, WithId<T>> {
	return Object.fromEntries(
		Object.entries(db).map(([id, obj]) => [id, { ...obj, id: parseInt(id) }]),
	);
}
function stellarisDb<T extends z.ZodType>(schema: T) {
	return z.record(z.coerce.number(), schema).default({}).transform(addIds);
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
	// TODO coerced array
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
	} else if (schema instanceof z.ZodEffects) {
		return convertSchemaToGameStateFilter(schema.innerType());
	} else if (schema instanceof z.ZodUnion) {
		const unionPaths = (schema.options as z.ZodType[]).map((option) =>
			convertSchemaToGameStateFilter(option),
		);
		const complexUnionPaths = unionPaths.filter((p) => typeof p !== 'boolean');
		if (unionPaths.includes(true)) return true;
		if (complexUnionPaths.length === 1)
			return complexUnionPaths[0] as (typeof complexUnionPaths)[number];
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
	} else if (
		schema instanceof z.ZodNumber ||
		schema instanceof z.ZodString ||
		schema instanceof z.ZodBoolean
	) {
		return false;
	} else {
		console.error('Unhandled ZodType', schema);
		throw new Error(`Unhandled ZodType`);
	}
}
export const gameStateFilter = convertSchemaToGameStateFilter(gameStateSchema);
