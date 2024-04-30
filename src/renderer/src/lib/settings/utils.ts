import { defaultMapSettings, type MapSettings } from './mapSettings';
import { mapSettingsConfig } from './mapSettingsConfig';
import type { UnknownSettingConfig } from './SettingConfig';

import type { PrimitiveType } from 'intl-messageformat';
import * as R from 'rambda';
import type { MessageID } from '../../intl';
import type { AppSettings } from './appSettings';
import { colorSettingSchema } from './ColorSetting';
import { iconSettingSchema } from './IconSetting';
import type { AppSettingConfig, MapSettingConfig } from './SettingConfig';
import { strokeSettingSchema } from './StrokeSetting';

export function isColorDynamic(color: string, settings: MapSettings): boolean {
	return (
		['primary', 'secondary'].includes(color) ||
		(color === 'border' && isColorDynamic(settings.borderColor.color, settings))
	);
}

export function validateAndResetMapSettings(unvalidatedSettings: MapSettings): MapSettings {
	const settings = { ...unvalidatedSettings };
	const configs = mapSettingsConfig.flatMap((category) => category.settings);
	for (const key of Object.keys(settings)) {
		const config = configs.find((config) => config.id === key);
		if (!config) {
			console.warn(`no config found for setting ${key}; deleting`);
			delete settings[key as keyof MapSettings];
		} else {
			const [valid] = validateSetting(
				settings[key as keyof MapSettings],
				config as UnknownSettingConfig,
			);
			if (!valid) {
				console.warn(`invalid value for setting ${key}; setting default`);
				(settings as any)[key] = (defaultMapSettings as any)[key];
			}
		}
	}
	for (const config of configs) {
		if (!Object.hasOwn(settings, config.id)) {
			console.warn(`missing value for setting ${config.id}; setting default`);
			(settings as any)[config.id] = (defaultMapSettings as any)[config.id];
		}
	}
	return settings;
}

export function validateSetting<T extends UnknownSettingConfig>(
	value: unknown,
	config: T,
): [boolean] | [boolean, MessageID, Record<string, PrimitiveType>] {
	switch (config.type) {
		case 'color': {
			const result = colorSettingSchema.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (config.allowedAdjustments) {
					return [
						data.colorAdjustments.every(
							(adjustment) =>
								adjustment.type == null || config.allowedAdjustments?.includes(adjustment.type),
						),
					];
				} else {
					return [true];
				}
			} else {
				return [false];
			}
		}
		case 'icon': {
			const result = iconSettingSchema.safeParse(value);
			return [result.success];
		}
		case 'number': {
			if (typeof value === 'number') {
				const min = config.min ?? -Infinity;
				const max = config.max ?? Infinity;
				const message =
					Number.isFinite(min) && Number.isFinite(max)
						? `validation.min_max`
						: Number.isFinite(min)
							? `validation.min`
							: `validation.max`;
				return [value >= min && value <= max, message, { min, max }];
			} else if (value == null) {
				return [Boolean(config.optional), 'validation.required', {}];
			} else {
				return [false];
			}
		}
		case 'range': {
			if (typeof value === 'number') {
				return [value >= config.min && value <= config.max];
			} else {
				return [false];
			}
		}
		case 'select': {
			if (typeof value === 'string') {
				if (config.dynamicOptions) {
					// dynamic options aren't checked for now; assume valid
					return [true];
				} else {
					return [config.options.some((option) => option.id === value)];
				}
			} else {
				return [false];
			}
		}
		case 'stroke': {
			const result = strokeSettingSchema.safeParse(value);
			if (result.success) {
				const { data } = result;
				if (data.dashed && config.noDashed) return [false];
				if (data.smoothing && config.noSmoothing) return [false];
				return [true];
			} else {
				return [false];
			}
		}
		case 'text': {
			return [typeof value === 'string'];
		}
		case 'toggle': {
			return [typeof value === 'boolean'];
		}
		default: {
			console.warn(`unknown setting type ${(config as { type?: unknown }).type}`);
			return [false];
		}
	}
}
export function asUnknownSettingConfig(config: AppSettingConfig | MapSettingConfig) {
	return config as UnknownSettingConfig;
}

export function asKnownSettingId(id: string) {
	return id as keyof MapSettings | keyof AppSettings;
}
export function settingsAreDifferent(
	a: MapSettings,
	b: MapSettings,
	{ requiresReprocessingOnly = false } = {},
) {
	return mapSettingsConfig
		.flatMap((group) => group.settings)
		.filter((setting) => !requiresReprocessingOnly || setting.requiresReprocessing)
		.some((setting) => {
			if (requiresReprocessingOnly && typeof setting.requiresReprocessing === 'function') {
				const settingType = setting.type;
				// switch is required for type inference
				switch (settingType) {
					case 'toggle':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'color':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'number':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'range':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'text':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'select':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'stroke':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					case 'icon':
						return setting.requiresReprocessing(a[setting.id], b[setting.id]);
					default:
						throw new Error(`Unhandled setting type: ${settingType}`);
				}
			}
			return !R.equals(a[setting.id], b[setting.id]);
		});
}
