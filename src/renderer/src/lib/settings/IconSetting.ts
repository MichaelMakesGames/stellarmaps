import { z } from 'zod';

import { colorSettingSchema } from './ColorSetting';

export const iconSettingSchema = z.object({
	enabled: z.boolean(),
	icon: z.string(),
	size: z.number(),
	position: z.enum(['left', 'right', 'top', 'bottom', 'center']),
	priority: z.number(),
	color: colorSettingSchema,
});
export type IconSetting = z.infer<typeof iconSettingSchema>;
export type IconPosition = IconSetting['position'];
export const ICON_POSITIONS = iconSettingSchema.shape.position.options;
