<script lang="ts">
	import {
		mapSettings,
		mapSettingsConfig,
		type IconMapSettings,
		type MapSettings,
		type SettingConfigIcon,
	} from '../settings';
	import type { MapData } from './data/processMapData';
	import { getFillColorAttributes } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	type SystemData = MapData['systems'][number];
	interface IconSettingMetadata {
		systemProperty?: keyof SystemData;
		mustKnowOwner?: boolean;
	}
	const metadata: Record<IconMapSettings, IconSettingMetadata> = {
		countryCapitalIcon: { systemProperty: 'isCountryCapital', mustKnowOwner: true },
		sectorCapitalIcon: { systemProperty: 'isSectorCapital', mustKnowOwner: true },
		populatedSystemIcon: { systemProperty: 'isColonized', mustKnowOwner: true },
		unpopulatedSystemIcon: {},
		wormholeIcon: { systemProperty: 'hasWormhole', mustKnowOwner: false },
		gatewayIcon: { systemProperty: 'hasGateway', mustKnowOwner: false },
		lGateIcon: { systemProperty: 'hasLGate', mustKnowOwner: false },
		shroudTunnelIcon: { systemProperty: 'hasShroudTunnel', mustKnowOwner: false },
	};

	function getSystemIcons(system: MapData['systems'][number], mapSettings: MapSettings) {
		const iconSettingConfigs = mapSettingsConfig
			.flatMap((category) => category.settings)
			.filter(
				(config): config is SettingConfigIcon<MapSettings, IconMapSettings> =>
					config.type === 'icon',
			)
			.filter((config) => mapSettings[config.id].enabled)
			.filter((config) => {
				const systemProperty = metadata[config.id].systemProperty;
				if (systemProperty != null && !system[systemProperty]) return false;
				if (metadata[config.id].mustKnowOwner && mapSettings.terraIncognita && !system.ownerIsKnown)
					return false;
				return true;
			})
			.sort((a, b) => mapSettings[b.id].priority - mapSettings[a.id].priority);
		const centerConfig = iconSettingConfigs.find(
			(config) => mapSettings[config.id].position === 'center',
		);
		const center =
			centerConfig == null ? null : { ...mapSettings[centerConfig.id], x: system.x, y: system.y };
		const startingOffset = (center?.size ?? 0) / 2;
		let offset = startingOffset;
		const left = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'left')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					x: system.x - offset - mapSettings[config.id].size / 2,
					y: system.y,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const right = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'right')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					x: system.x + offset + mapSettings[config.id].size / 2,
					y: system.y,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const top = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'top')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					y: system.y - offset - mapSettings[config.id].size / 2,
					x: system.x,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		offset = startingOffset;
		const bottom = iconSettingConfigs
			.filter((config) => mapSettings[config.id].position === 'bottom')
			.map((config) => {
				const icon = {
					...mapSettings[config.id],
					y: system.y + offset + mapSettings[config.id].size / 2,
					x: system.x,
				};
				offset += mapSettings[config.id].size;
				return icon;
			});
		return { center, left, right, top, bottom, system };
	}

	function getIconsBottom(systemIcons: ReturnType<typeof getSystemIcons>): number {
		return Math.max(
			systemIcons.center
				? systemIcons.center.y + systemIcons.center.size / 2
				: systemIcons.system.y,
			...systemIcons.left.map((i) => i.y + i.size / 2),
			...systemIcons.right.map((i) => i.y + i.size / 2),
			...systemIcons.top.map((i) => i.y + i.size / 2),
			...systemIcons.bottom.map((i) => i.y + i.size / 2),
		);
	}

	function shouldShowLabel(system: MapData['systems'][number]) {
		if ($mapSettings.systemNames === 'none') return false;
		if ($mapSettings.systemNames === 'all') return true;
		if ($mapSettings.systemNames === 'countryCapitals' && system.isCountryCapital) return true;
		if (
			$mapSettings.systemNames === 'sectorCapitals' &&
			(system.isCountryCapital || system.isSectorCapital)
		)
			return true;
		if ($mapSettings.systemNames === 'colonized' && system.isColonized) return true;
		return false;
	}
</script>

{#each data.systems
	.filter((s) => s.systemIsKnown || !$mapSettings.terraIncognita)
	.map((s) => getSystemIcons(s, $mapSettings)) as systemIcons}
	{#each [...(systemIcons.center ? [systemIcons.center] : []), ...systemIcons.left, ...systemIcons.right, ...systemIcons.top, ...systemIcons.bottom] as systemIcon}
		<use
			href="#{systemIcon.icon}"
			x={systemIcon.x - systemIcon.size / 2}
			y={systemIcon.y - systemIcon.size / 2}
			width={systemIcon.size}
			height={systemIcon.size}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colors,
				countryColors: systemIcons.system,
				colorStack: [systemIcon.color, $mapSettings.borderFillColor],
			})}
		/>
	{/each}
	{#if shouldShowLabel(systemIcons.system)}
		<text
			x={systemIcons.system.x}
			y={getIconsBottom(systemIcons) + $mapSettings.systemNamesFontSize / 4}
			text-anchor="middle"
			dominant-baseline="hanging"
			font-size={$mapSettings.systemNamesFontSize}
			fill="white"
			font-family={$mapSettings.systemNamesFont}
			style:text-shadow="0px 0px 3px black"
		>
			{systemIcons.system.name}
		</text>
	{/if}
{/each}
