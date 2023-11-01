<script lang="ts">
	import { mapSettings, type ColorSetting, isColorDynamic } from '$lib/mapSettings';
	import type { MapData } from '$lib/map/data/processMapData';
	import { getStrokeAttributes, resolveColor } from './mapUtils';

	export let data: MapData;
	export let colors: Record<string, string>;

	function getOpacity(color: ColorSetting) {
		return color.colorAdjustments.find((a) => a.type === 'Opacity')?.value ?? 1;
	}

	function filterOpacity(color: ColorSetting) {
		return {
			...color,
			colorAdjustments: color.colorAdjustments.filter((a) => a.type !== 'Opacity'),
		};
	}

	$: hyperRelaysDisabled = !$mapSettings.hyperRelayStroke.enabled;
	$: hyperRelayIsDynamic = isColorDynamic($mapSettings.hyperRelayColor.color, $mapSettings);
	$: unownedHyperRelayColor = hyperRelayIsDynamic
		? $mapSettings.unownedHyperRelayColor
		: $mapSettings.hyperRelayColor;
	$: unownedHyperRelayPath = [
		data.unownedRelayHyperlanesPath,
		...data.borders
			.filter((border) =>
				hyperRelayIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
			)
			.map((border) => border.relayHyperlanesPath),
	].join(' ');

	$: hyperlanesDisabled = !$mapSettings.hyperlaneStroke.enabled;
	$: hyperlaneIsDynamic = isColorDynamic($mapSettings.hyperlaneColor.color, $mapSettings);
	$: unownedHyperlaneColor = hyperlaneIsDynamic
		? $mapSettings.unownedHyperlaneColor
		: $mapSettings.hyperlaneColor;
	$: unownedHyperlanePath =
		[
			data.unownedHyperlanesPath,
			...data.borders
				.filter((border) =>
					hyperlaneIsDynamic ? !border.isKnown && $mapSettings.terraIncognita : true,
				)
				.map((border) => border.hyperlanesPath),
		].join(' ') + (hyperRelaysDisabled ? ` ${unownedHyperRelayPath}` : '');
</script>

{#if !hyperlanesDisabled}
	{#if $mapSettings.hyperlaneStroke.glow}
		<path
			d={unownedHyperlanePath}
			stroke={resolveColor($mapSettings, colors, null, {
				value: filterOpacity(unownedHyperlaneColor),
			})}
			stroke-opacity={getOpacity(unownedHyperlaneColor)}
			{...getStrokeAttributes($mapSettings.hyperlaneStroke, true)}
			fill="none"
		/>
	{/if}
	<path
		d={unownedHyperlanePath}
		stroke={resolveColor($mapSettings, colors, null, {
			value: filterOpacity(unownedHyperlaneColor),
		})}
		stroke-opacity={getOpacity(unownedHyperlaneColor)}
		{...getStrokeAttributes($mapSettings.hyperlaneStroke, false)}
		fill="none"
	/>
{/if}
{#if !hyperRelaysDisabled}
	{#if $mapSettings.hyperRelayStroke.glow}
		<path
			d={unownedHyperRelayPath}
			stroke={resolveColor($mapSettings, colors, null, {
				value: filterOpacity(unownedHyperRelayColor),
			})}
			stroke-opacity={getOpacity(unownedHyperRelayColor)}
			{...getStrokeAttributes($mapSettings.hyperRelayStroke, true)}
			fill="none"
		/>
	{/if}
	<path
		d={unownedHyperRelayPath}
		stroke={resolveColor($mapSettings, colors, null, {
			value: filterOpacity(unownedHyperRelayColor),
		})}
		stroke-opacity={getOpacity(unownedHyperRelayColor)}
		{...getStrokeAttributes($mapSettings.hyperRelayStroke, false)}
		fill="none"
	/>
{/if}

{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
	{#if !hyperlanesDisabled && hyperlaneIsDynamic}
		{#if $mapSettings.hyperlaneStroke.glow}
			<path
				d={hyperRelaysDisabled
					? `${border.hyperlanesPath} ${border.relayHyperlanesPath}`
					: border.hyperlanesPath}
				stroke={resolveColor($mapSettings, colors, border, {
					value: filterOpacity($mapSettings.hyperlaneColor),
				})}
				stroke-opacity={getOpacity($mapSettings.hyperlaneColor)}
				{...getStrokeAttributes($mapSettings.hyperlaneStroke, true)}
				fill="none"
			/>
		{/if}
		<path
			d={hyperRelaysDisabled
				? `${border.hyperlanesPath} ${border.relayHyperlanesPath}`
				: border.hyperlanesPath}
			stroke={resolveColor($mapSettings, colors, border, {
				value: filterOpacity($mapSettings.hyperlaneColor),
			})}
			stroke-opacity={getOpacity($mapSettings.hyperlaneColor)}
			{...getStrokeAttributes($mapSettings.hyperlaneStroke, false)}
			fill="none"
		/>
	{/if}
	{#if !hyperRelaysDisabled && hyperRelayIsDynamic}
		{#if $mapSettings.hyperRelayStroke.glow}
			<path
				d={border.relayHyperlanesPath}
				stroke={resolveColor($mapSettings, colors, border, {
					value: filterOpacity($mapSettings.hyperRelayColor),
				})}
				stroke-opacity={getOpacity($mapSettings.hyperRelayColor)}
				{...getStrokeAttributes($mapSettings.hyperRelayStroke, true)}
				fill="none"
			/>
		{/if}
		<path
			d={border.relayHyperlanesPath}
			stroke={resolveColor($mapSettings, colors, border, {
				value: filterOpacity($mapSettings.hyperRelayColor),
			})}
			stroke-opacity={getOpacity($mapSettings.hyperRelayColor)}
			{...getStrokeAttributes($mapSettings.hyperRelayStroke, false)}
			fill="none"
		/>
	{/if}
{/each}
