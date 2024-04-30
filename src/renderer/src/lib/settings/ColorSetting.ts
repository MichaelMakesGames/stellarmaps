import { z } from 'zod';

export const colorSettingSchema = z.object({
	color: z.string(),
	colorAdjustments: z.array(
		z.object({
			type: z
				.enum(['LIGHTEN', 'DARKEN', 'MIN_LIGHTNESS', 'MAX_LIGHTNESS', 'OPACITY', 'MIN_CONTRAST'])
				.nullish(),
			value: z.number().min(0).max(1),
		}),
	),
});
export type ColorSetting = z.infer<typeof colorSettingSchema>;
export type ColorSettingAdjustment = ColorSetting['colorAdjustments'][number];
export type ColorSettingAdjustmentType = NonNullable<ColorSettingAdjustment['type']>;
export const COLOR_SETTING_ADJUSTMENT_TYPES =
	colorSettingSchema.shape.colorAdjustments.element.shape.type.unwrap().unwrap().options;
