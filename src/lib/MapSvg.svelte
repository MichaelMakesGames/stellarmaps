<script lang="ts">
	import { select } from 'd3-selection';
	import {
		symbol,
		symbolCircle,
		symbolCross,
		symbolDiamond,
		symbolSquare,
		symbolStar,
		symbolTriangle,
		symbolWye,
		type SymbolType,
	} from 'd3-shape';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { writable } from 'svelte/store';
	import { mapSettings, lastProcessedMapSettings } from './mapSettings';
	import processMapData, { resolveColor } from './processMapData';

	export let id: string = '';
	export let data: Awaited<ReturnType<typeof processMapData>>;
	export let colors: Record<string, string>;
	export let onZoom: undefined | (() => void) = undefined;
	export let exportMode: boolean = false;
	export let exportModeViewBox: string = '';
	export let exportWidth: number = 1000;
	export let exportHeight: number = 1000;

	const debug = writable(false);
	(window as any).debug = debug;

	let svg: null | Element = null;
	let g: null | SVGGElement = null;
	let zoomHandler = zoom().on('zoom', ({ transform }) => {
		onZoom?.();
		if (g) g.setAttribute('transform', transform);
	});
	$: if (svg && !exportMode) {
		select(svg).call(zoomHandler);
	}
	export const resetZoom = () => {
		if (svg) {
			select(svg).call(zoomHandler.transform, zoomIdentity);
		}
	};

	const symbols: Record<string, SymbolType> = {
		circle: symbolCircle,
		cross: symbolCross,
		diamond: symbolDiamond,
		square: symbolSquare,
		star: symbolStar,
		triangle: symbolTriangle,
		wye: symbolWye,
	};
	$: countryCapitalIconPath =
		$mapSettings.countryCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.countryCapitalIcon], $mapSettings.countryCapitalIconSize)()
			: '';
	$: sectorCapitalIconPath =
		$mapSettings.sectorCapitalIcon !== 'none'
			? symbol(symbols[$mapSettings.sectorCapitalIcon], $mapSettings.sectorCapitalIconSize)()
			: '';
	$: populatedSystemIconPath =
		$mapSettings.populatedSystemIcon !== 'none'
			? symbol(symbols[$mapSettings.populatedSystemIcon], $mapSettings.populatedSystemIconSize)()
			: '';
	$: unpopulatedSystemIconPath =
		$mapSettings.unpopulatedSystemIcon !== 'none'
			? symbol(
					symbols[$mapSettings.unpopulatedSystemIcon],
					$mapSettings.unpopulatedSystemIconSize,
			  )()
			: '';

	$: terraIncognitaColor = `rgba(${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness},${$mapSettings.terraIncognitaBrightness})`;
	$: terraIncognitaLightStripeColor = `rgba(${Math.min(
		255,
		$mapSettings.terraIncognitaBrightness + 10,
	)},${Math.min(255, $mapSettings.terraIncognitaBrightness + 10)},${Math.min(
		255,
		$mapSettings.terraIncognitaBrightness + 10,
	)})`;
	$: terraIncognitaDarkStripeColor = `rgba(${Math.max(
		0,
		$mapSettings.terraIncognitaBrightness - 10,
	)},${Math.max(0, $mapSettings.terraIncognitaBrightness - 10)},${Math.max(
		0,
		$mapSettings.terraIncognitaBrightness - 10,
	)})`;
</script>

<svg
	{id}
	xmlns="http://www.w3.org/2000/svg"
	viewBox={exportMode ? exportModeViewBox : '-500 -500 1000 1000'}
	width={exportMode ? exportWidth : undefined}
	height={exportMode ? exportHeight : undefined}
	class={exportMode ? undefined : 'w-full h-full'}
	style="background: #111; text-shadow: 0px 0px 3px black;"
	bind:this={svg}
>
	<defs>
		{#if data}
			{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
				<clipPath id="border-{border.countryId}-inner-clip-path">
					<use href="#border-{border.countryId}-inner" />
				</clipPath>
				<clipPath id="border-{border.countryId}-outer-clip-path">
					<use href="#border-{border.countryId}-outer" />
				</clipPath>
				{#if $mapSettings.terraIncognita && $mapSettings.terraIncognitaStyle === 'striped'}
					<pattern
						id="dark-stripes"
						viewBox="0,0,10,10"
						preserveAspectRatio="none"
						width="100%"
						height="10"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(-45)"
					>
						<rect fill={terraIncognitaLightStripeColor} width="10" height="6" />
						<rect fill={terraIncognitaDarkStripeColor} width="10" height="6" y="5" />
					</pattern>
				{/if}
				{#if $mapSettings.terraIncognita && $mapSettings.terraIncognitaStyle === 'cloudy'}
					<filter id="terra-incognita-filter">
						<feGaussianBlur in="SourceGraphic" result="blurred" stdDeviation="2" />
						<feTurbulence
							type="turbulence"
							numOctaves="4"
							baseFrequency="0.02"
							result="turbulence"
						/>
						<feColorMatrix
							type="matrix"
							in="turbulence"
							result="grayturb"
							values="
										0.2126 0.7152 0.0722 0 0
										0.2126 0.7152 0.0722 0 0
										0.2126 0.7152 0.0722 0 0
										0 0 0 1 0"
						/>
						<feBlend in2="blurred" in="grayturb" result="cloudy" mode="multiply" />
						<feComposite in="cloudy" in2="blurred" operator="in" />
					</filter>
				{/if}
			{/each}
		{/if}
	</defs>
	<g bind:this={g}>
		{#if data}
			{#each data.borders.filter((border) => border.isKnown || !$mapSettings.terraIncognita) as border}
				<path
					id="border-{border.countryId}-outer"
					d={border.outerPath}
					fill={resolveColor($mapSettings, colors, border, $mapSettings.borderColor)}
				/>
				<path
					id="border-{border.countryId}-inner"
					d={border.innerPath}
					fill={resolveColor($mapSettings, colors, border, $mapSettings.borderFillColor)}
				/>
				{#if $mapSettings.sectorBorders}
					{#each border.sectorBorders as sectorBorder}
						<path
							d={sectorBorder.path}
							stroke-width={sectorBorder.isUnionBorder
								? $mapSettings.unionBorderWidth
								: $mapSettings.sectorBorderWidth}
							clip-path={resolveColor(
								$mapSettings,
								colors,
								border,
								$mapSettings.borderFillColor,
							) === resolveColor($mapSettings, colors, border, $mapSettings.borderColor)
								? `url(#border-${border.countryId}-outer-clip-path)`
								: `url(#border-${border.countryId}-inner-clip-path)`}
							stroke={resolveColor(
								$mapSettings,
								colors,
								border,
								$mapSettings.sectorBorderColor,
								$mapSettings.borderFillColor,
								$mapSettings.sectorBorderMinContrast,
							)}
							stroke-linecap={sectorBorder.isUnionBorder || !$mapSettings.sectorBorderDashArray
								? 'round'
								: null}
							stroke-linejoin={sectorBorder.isUnionBorder || !$mapSettings.sectorBorderDashArray
								? 'round'
								: null}
							fill="none"
							stroke-dasharray={sectorBorder.isUnionBorder
								? ''
								: $mapSettings.sectorBorderDashArray}
						/>
					{/each}
				{/if}
			{/each}
			<path
				d={data.hyperlanesPath}
				stroke="white"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width={$mapSettings.hyperlaneWidth}
				opacity={$mapSettings.hyperlaneOpacity}
			/>
			<path
				d={data.relayHyperlanesPath}
				stroke="white"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width={$mapSettings.hyperRelayWidth}
				opacity={$mapSettings.hyperRelayOpacity}
			/>
			{#if $mapSettings.terraIncognita}
				<!-- filtered and patterned path disappears at some zoom levels -->
				<!-- always draw a flat terra incognita underneath as a fallback -->
				<path
					id="terra-incognita-fallback"
					d={data.terraIncognitaPath}
					fill={terraIncognitaColor}
				/>
				<path
					id="terra-incognita"
					d={data.terraIncognitaPath}
					fill={$mapSettings.terraIncognitaStyle === 'striped'
						? 'url(#dark-stripes)'
						: terraIncognitaColor}
					filter={$mapSettings.terraIncognitaStyle === 'cloudy'
						? 'url(#terra-incognita-filter)'
						: ''}
				/>
			{/if}
			{#each data.systems as system}
				{#if system.isCountryCapital && $mapSettings.countryCapitalIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
					<path
						transform="translate({system.x},{system.y})"
						d={countryCapitalIconPath}
						fill={resolveColor(
							$mapSettings,
							colors,
							system,
							$mapSettings.populatedSystemIconColor,
							$mapSettings.borderFillColor,
							$mapSettings.populatedSystemIconMinContrast,
						)}
					/>
				{:else if system.isSectorCapital && $mapSettings.sectorCapitalIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
					<path
						transform="translate({system.x},{system.y})"
						d={sectorCapitalIconPath}
						fill={resolveColor(
							$mapSettings,
							colors,
							system,
							$mapSettings.populatedSystemIconColor,
							$mapSettings.borderFillColor,
							$mapSettings.populatedSystemIconMinContrast,
						)}
					/>
				{:else if system.isColonized && $mapSettings.populatedSystemIcon !== 'none' && (!$mapSettings.terraIncognita || (system.systemIsKnown && system.ownerIsKnown))}
					<path
						transform="translate({system.x},{system.y})"
						d={populatedSystemIconPath}
						fill={resolveColor(
							$mapSettings,
							colors,
							system,
							$mapSettings.populatedSystemIconColor,
							$mapSettings.borderFillColor,
							$mapSettings.populatedSystemIconMinContrast,
						)}
					/>
				{:else if $mapSettings.unpopulatedSystemIcon !== 'none' && (!$mapSettings.terraIncognita || system.systemIsKnown)}
					<path
						transform="translate({system.x},{system.y})"
						d={unpopulatedSystemIconPath}
						fill="white"
					/>
				{/if}
			{/each}
			{#each data.labels.filter((label) => label.isKnown || !$mapSettings.terraIncognita) as label}
				{#each label.labelPoints as { point, emblemWidth, emblemHeight, textWidth, textHeight }}
					{#if $debug}<circle cx={point[0]} cy={point[1]} r={3} fill="#F0F" />{/if}
					{#if $debug && emblemWidth && emblemHeight}
						<rect
							stroke-width={1}
							stroke="#F0F"
							x={point[0] - emblemWidth / 2}
							y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
							width={emblemWidth}
							height={emblemHeight}
							fill="transparent"
						/>
					{/if}
					{#if emblemWidth && emblemHeight && label.emblemKey && data.emblems[label.emblemKey]}
						<image
							x={point[0] - emblemWidth / 2}
							y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
							width={emblemWidth}
							height={emblemHeight}
							href={data.emblems[label.emblemKey]}
						/>
						{#if !exportMode}
							<!-- This lets the user right-click "Copy Image" to paste into an external program -->
							<foreignObject
								x={point[0] - emblemWidth / 2}
								y={point[1] - (textHeight ? emblemHeight : emblemHeight / 2)}
								width={emblemWidth}
								height={emblemHeight}
								href={data.emblems[label.emblemKey]}
								opacity="0"
							>
								<img
									width={emblemWidth}
									height={emblemHeight}
									src={data.emblems[label.emblemKey]}
									alt="Country Emblem"
								/>
							</foreignObject>
						{/if}
						{#if label.isUnionLeader}
							<text
								transform="translate({point[0]},{point[1] -
									(textHeight ? emblemHeight : emblemHeight / 2)})"
								fill="white"
								text-anchor="middle"
								dominant-baseline="bottom"
								font-size={emblemHeight * $mapSettings.unionLeaderSymbolSize}
							>
								{$mapSettings.unionLeaderSymbol}
							</text>
						{/if}
					{/if}
					{#if $debug && textWidth && textHeight}
						<rect
							stroke-width={1}
							stroke="#F0F"
							x={point[0] - textWidth / 2}
							y={point[1] - (emblemHeight ? 0 : textHeight / 2)}
							width={textWidth}
							height={textHeight}
							fill="transparent"
						/>
					{/if}
					{#if textWidth && textHeight && label.name}
						<text
							x={point[0]}
							y={point[1] + (emblemHeight ? textHeight / 2 : 0)}
							text-anchor="middle"
							dominant-baseline="middle"
							font-size={textHeight}
							fill="white"
							font-family={$lastProcessedMapSettings.countryNamesFont}
							textLength={textWidth}
							lengthAdjust="spacingAndGlyphs"
							text-decoration={label.isUnionLeader && $mapSettings.unionLeaderUnderline
								? 'underline'
								: ''}
						>
							{label.name}
						</text>
					{/if}
				{/each}
			{/each}
			{#if $debug}
				{#each data.galaxyBorderCircles as circle}
					<circle
						cx={-circle.cx}
						cy={circle.cy}
						r={circle.r}
						stroke-width={['outer-padded', 'inner-padded', 'outlier'].includes(circle.type) ? 2 : 1}
						stroke={circle.type === 'outlier'
							? 'green'
							: circle.type.startsWith('outer')
							? 'blue'
							: 'red'}
						fill="transparent"
					/>
				{/each}
			{/if}
		{/if}
	</g>
</svg>
