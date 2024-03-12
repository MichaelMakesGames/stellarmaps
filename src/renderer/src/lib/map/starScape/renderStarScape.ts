import alea from 'alea';
import { GlowFilter } from 'pixi-filters';
import * as PIXI from 'pixi.js';
import 'pixi.js/app';
import 'pixi.js/filters';
import 'pixi.js/graphics';
import 'pixi.js/unsafe-eval';
import * as R from 'rambda';
import type { GameState } from '../../GameState';
import type { ColorSetting, MapSettings } from '../../mapSettings';
import { isDefined } from '../../utils';
import { resolveColor } from '../mapUtils';
import shaderString from './noiseShader.glsl?raw';

interface Layer {
	color: string;
	opacity: number;
	radius: number;
	blur: number;
	sourceCoordinates: ([number, number] | [number, number])[];
	octaves: number;
	scale: number;
	gain?: number;
	lacunarity?: number;
	min?: number;
	max?: number;
}

const canvas = document.createElement('canvas');
const app = new PIXI.Application();
const initPromise = app.init({
	canvas,
	width: 1000,
	height: 1000,
	antialias: true,
	backgroundAlpha: 0,
	preference: 'webgl',
	autoStart: false,
	manageImports: false,
});

const graphicsPool: PIXI.Graphics[] = [];

export default async function renderStarScape(
	gameState: GameState,
	settings: MapSettings,
	colors: Record<string, string>,
	viewBox: { left: number; top: number; width: number; height: number } = {
		left: -500,
		top: -500,
		width: 1000,
		height: 1000,
	},
	output: { width: number; height: number } = { width: 1000, height: 1000 },
) {
	const usedGraphics: PIXI.Graphics[] = [];
	await initPromise;
	const outputRatio = output.width / viewBox.width;

	function mapCoordToCanvasCoord(x: number, y: number): [number, number] {
		return [
			((-x - viewBox.left) * output.width) / viewBox.width,
			((y - viewBox.top) * output.height) / viewBox.height,
		];
	}

	const systemCoords = Object.values(gameState.galactic_object).map((system) =>
		mapCoordToCanvasCoord(system.coordinate.x, system.coordinate.y),
	);

	const nebulaCoords = gameState.nebula.flatMap((nebula) =>
		nebula.galactic_object
			.map((system) => gameState.galactic_object[system])
			.filter(isDefined)
			.map((system) => mapCoordToCanvasCoord(system.coordinate.x, system.coordinate.y)),
	);

	const layers: Layer[] = [
		// dust
		...(settings.starScapeDust
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeDustColor)],
						}),
						opacity: getOpacity(settings.starScapeDustColor),
						radius: 15,
						blur: 25,
						scale: 1 / 32,
						octaves: 8,
						gain: 0.6,
						min: 0.3,
						sourceCoordinates: systemCoords,
					},
				]
			: []),
		// stars
		...(settings.starScapeStars
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeStarsColor)],
						}),
						opacity: getOpacity(settings.starScapeStarsColor),
						radius: -1,
						blur: -1,
						octaves: -1,
						scale: -1,
						sourceCoordinates: systemCoords,
					},
				]
			: []),
		// core
		...(settings.starScapeCore
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeCoreColor)],
						}),
						opacity: getOpacity(settings.starScapeCoreColor),
						radius: gameState.galaxy.core_radius * 0.8,
						blur: gameState.galaxy.core_radius,
						scale: 4,
						octaves: 1,
						min: 1,
						sourceCoordinates: [mapCoordToCanvasCoord(0, 0)],
					},
					// core highlights
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeCoreAccentColor)],
						}),
						opacity: getOpacity(settings.starScapeCoreAccentColor),
						radius: gameState.galaxy.core_radius * 0.8,
						blur: gameState.galaxy.core_radius * 0.6,
						scale: 1 / 32,
						octaves: 4,
						min: 0,
						sourceCoordinates: [mapCoordToCanvasCoord(0, 0)],
					},
				]
			: []),
		// nebula
		...(settings.starScapeNebula
			? [
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeNebulaColor)],
						}),
						opacity: getOpacity(settings.starScapeNebulaColor),
						radius: 15,
						blur: 10,
						scale: 1 / 16,
						octaves: 12,
						gain: 0.75,
						min: 0.25,
						sourceCoordinates: nebulaCoords,
					},
					// nebula highlights
					{
						color: resolveColor({
							mapSettings: settings,
							colors,
							colorStack: [removeOpacity(settings.starScapeNebulaAccentColor)],
						}),
						opacity: getOpacity(settings.starScapeNebulaAccentColor),
						radius: 15,
						blur: 10,
						scale: 1 / 8,
						octaves: 12,
						gain: 0.5,
						min: -0.25,
						sourceCoordinates: nebulaCoords,
					},
				]
			: []),
	];

	const galaxySizeRadiusAdjustment = Math.sqrt(
		1000 / Object.keys(gameState.galactic_object).length,
	);
	app.renderer.resize(output.width, output.height);
	app.stage.removeChildren();
	layers.forEach((layer) => {
		const isStarLayer = layer.octaves === -1;
		const c = new PIXI.Color(layer.color);
		c.premultiply(layer.opacity);
		c.setAlpha(layer.opacity);
		if (isStarLayer) {
			const container = new PIXI.Container({ isRenderGroup: true });
			const gc = new PIXI.GraphicsContext().circle(0, 0, 1).fill(c);
			const rng = alea(0);
			let i = 0;
			while (i < (settings.starScapeStarsCount ?? 0)) {
				i++;
				const g = graphicsPool.pop() ?? new PIXI.Graphics();
				usedGraphics.push(g);
				g.clear();
				g.context = gc;
				const origin = layer.sourceCoordinates[Math.floor(rng() * layer.sourceCoordinates.length)];
				if (!origin) continue;
				const distance = (rng() * 20 + 5) * outputRatio;
				const angle = rng() * 2 * Math.PI;
				const dx = Math.cos(angle) * distance;
				const dy = Math.sin(angle) * distance;
				const cx = origin[0] + dx;
				const cy = origin[1] + dy;
				const r = rng();
				g.x = cx;
				g.y = cy;
				g.scale = { x: r, y: r };
				container.addChild(g);
			}
			container.filters = [
				new PIXI.AlphaFilter({ alpha: Math.max(0.1, 1 - 1 / Math.sqrt(outputRatio)) }),
				new GlowFilter({
					color: c.toNumber(),
					outerStrength: 2 * outputRatio,
					quality: 0.9,
				}),
			];
			app.stage.addChild(container);
		} else {
			const container = new PIXI.Container({ isRenderGroup: true });
			const gc = new PIXI.GraphicsContext()
				.circle(0, 0, layer.radius * outputRatio * galaxySizeRadiusAdjustment)
				.fill(c);
			for (const [cx, cy] of layer.sourceCoordinates) {
				const g = graphicsPool.pop() ?? new PIXI.Graphics();
				usedGraphics.push(g);
				g.clear();
				g.context = gc;
				g.x = cx;
				g.y = cy;
				container.addChild(g);
			}
			app.stage.addChild(container);

			const MAX_BLUR = 2000; // start getting WebGL errors if blur strength is too large
			const blurFilter = new PIXI.BlurFilter({
				strength: Math.max(
					1,
					Math.min(MAX_BLUR, Math.round(layer.blur * galaxySizeRadiusAdjustment * outputRatio)),
				),
				quality: Math.max(1, Math.round(layer.blur / 4)),
				kernelSize: 15,
			});
			const cloudFilter = new PIXI.Filter({
				glProgram: PIXI.GlProgram.from({
					name: 'CloudFilter',
					vertex: PIXI.defaultFilterVert,
					fragment: shaderString.replace('$OCTAVES$', layer.octaves.toFixed(1)),
				}),
				resources: {
					filterUniforms: new PIXI.UniformGroup({
						uScale: { type: 'f32', value: layer.scale },
						uNormalization: {
							type: 'f32',
							value:
								1 /
								R.range(0, layer.octaves).reduce((acc, cur) => acc + (layer.gain ?? 0.5) ** cur, 0),
						},
						uGain: { type: 'f32', value: layer.gain ?? 0.5 },
						uLacunarity: { type: 'f32', value: layer.lacunarity ?? 2.0 },
						uMin: { type: 'f32', value: layer.min ?? 0 },
						uMax: { type: 'f32', value: layer.max ?? 1 },
						uViewBoxLeft: { type: 'f32', value: viewBox.left },
						uViewBoxTop: { type: 'f32', value: viewBox.top },
						uViewBoxWidth: { type: 'f32', value: viewBox.width },
						uViewBoxHeight: { type: 'f32', value: viewBox.height },
						uOutputWidth: { type: 'f32', value: output.width },
						uOutputHeight: { type: 'f32', value: output.height },
					}),
				},
			});
			container.filterArea = new PIXI.Rectangle(0, 0, output.width, output.height);
			container.filters = [blurFilter, cloudFilter];
		}
	});
	app.render();
	for (const g of usedGraphics) {
		g.clear();
		g.scale = { x: 1, y: 1 };
	}
	graphicsPool.push(...usedGraphics);
	return canvas.toDataURL('image/png');
}

function removeOpacity(color: ColorSetting): ColorSetting {
	return {
		...color,
		colorAdjustments: color.colorAdjustments.filter((a) => a.type !== 'OPACITY'),
	};
}

function getOpacity(color: ColorSetting): number {
	return color.colorAdjustments.find((a) => a.type === 'OPACITY')?.value ?? 1;
}
