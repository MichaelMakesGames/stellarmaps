<script lang="ts">
	import { mapSettings } from '../settings';
	import type { MapData } from './data/processMapData';
	import {
		getFillColorAttributes,
		getStrokeAttributes,
		getStrokeColorAttributes,
	} from './mapUtils';

	export let data: null | MapData;
	export let colors: null | Record<string, string>;

	$: borderWidth = $mapSettings.legendBorderStroke.enabled
		? $mapSettings.legendBorderStroke.width
		: 0;
	$: padding = $mapSettings.legendFontSize;
	$: symbolSize = $mapSettings.legendFontSize * 1.25;
	$: symbolLabelGap = $mapSettings.legendFontSize / 4;
	$: rowGap = $mapSettings.legendFontSize / 2;
	$: width =
		(data?.legend.maxLabelWidth ?? 0) + symbolSize + symbolLabelGap + padding * 2 + borderWidth * 2;
	$: height =
		symbolSize * (data?.legend.items.length ?? 0) +
		rowGap * ((data?.legend.items ?? [null]).length - 1) +
		padding * 2 +
		borderWidth * 2;
</script>

{#if data?.legend.items.length && $mapSettings.legend}
	<svg viewBox="0 0 {width} {height}" width="{width}px" height="{height}px">
		<rect
			x={borderWidth / 2}
			y={borderWidth / 2}
			width={width - borderWidth}
			height={height - borderWidth}
			{...getStrokeAttributes($mapSettings.legendBorderStroke)}
			{...getStrokeColorAttributes({
				mapSettings: $mapSettings,
				colorStack: [$mapSettings.legendBorderColor],
				colors: colors ?? {},
			})}
			{...getFillColorAttributes({
				mapSettings: $mapSettings,
				colorStack: [$mapSettings.legendBackgroundColor],
				colors: colors ?? {},
			})}
		></rect>
		{#each data?.legend.items ?? [] as item, i}
			<g
				transform="translate({borderWidth + padding} {borderWidth +
					padding +
					(symbolSize + rowGap) * i})"
			>
				{#if colors && item.symbol.type === 'border'}
					<circle
						cx={symbolSize / 2}
						cy={symbolSize / 2}
						r={symbolSize / 2 - 1}
						stroke-width={2}
						{...getStrokeColorAttributes({
							mapSettings: $mapSettings,
							countryColors: item.symbol,
							colorStack: [$mapSettings.borderColor, $mapSettings.borderFillColor],
							colors,
						})}
						{...getFillColorAttributes({
							mapSettings: $mapSettings,
							countryColors: item.symbol,
							colorStack: [$mapSettings.borderFillColor],
							colors,
						})}
					/>
				{/if}
				<text
					fill="#FFFFFF"
					x={symbolSize + symbolLabelGap}
					y={symbolSize / 2}
					dominant-baseline="middle"
					font-size={$mapSettings.legendFontSize}
				>
					{item.label}
				</text>
			</g>
		{/each}
	</svg>
{/if}
