<script lang="ts">
	import { mapSettings } from '../settings';
	import { mapModes } from './data/mapModes';
	import type { MapData } from './data/processMapData';
	import { getStrokeColorAttributes } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	function getMapModePaths(systems: MapData['systems']) {
		const max = Math.max(...systems.map((s) => s.mapModeTotalValue ?? 0));
		const scale = (100 / max) * (mapModes[$mapSettings.mapMode]?.system?.scale ?? 1);
		return systems
			.filter((system) => system.mapModeValues?.some((v) => v.directedValues?.size))
			.flatMap((system) => {
				return (
					system.mapModeValues?.flatMap((systemValue) =>
						Array.from(systemValue.directedValues?.entries() ?? []).map(([to, value]) => ({
							from: {
								x: system.x,
								y: system.y,
							},
							to: {
								x: data.systems.find((s) => s.id === to)?.x ?? 0,
								y: data.systems.find((s) => s.id === to)?.y ?? 0,
							},
							width: Math.sqrt(value * scale),
							color: systemValue.color,
						})),
					) ?? []
				);
			});
	}
</script>

{#each getMapModePaths(data.systems.filter((s) => s.systemIsKnown || !$mapSettings.terraIncognita)) as path}
	<line
		x1={path.from.x}
		y1={path.from.y}
		x2={path.to.x}
		y2={path.to.y}
		stroke-width={Math.max(0.5, path.width)}
		stroke-dasharray={path.width === 0 ? '0.5 1' : undefined}
		{...getStrokeColorAttributes({
			mapSettings: $mapSettings,
			colors,
			colorStack: [path.color, $mapSettings.borderFillColor],
		})}
	/>
{/each}
