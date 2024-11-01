// only the types used are implemented
// see https://skia.org/docs/user/modules/pathkit/#api for more
declare module 'pathkit-wasm/bin/pathkit' {
	function PathKitInit(options?: { locateFile: (file: string) => string }): Promise<PathKit>;

	export interface PathKit {
		NewPath(): SkPath;
		FromSVGString(str: string): SkPath;
		MakeFromOp(path1: SkPath, path2: SkPath, op: PathOp): SkPath;
		PathOp: {
			UNION: PathOp;
			DIFFERENCE: PathOp;
			INTERSECT: PathOp;
			XOR: PathOp;
			REVERSE_DIFFERENCE: PathOp;
		};
	}

	enum PathOp {
		UNION,
		DIFFERENCE,
		INTERSECT,
		XOR,
		REVERSE_DIFFERENCE,
	}

	export interface SkPath {
		arc(
			x: number,
			y: number,
			radius: number,
			startAngle: number,
			endAngle: number,
			ccw = false,
		): SkPath;
		op(path: SkPath, op: PathOp): SkPath;
		toSVGString(): string;
		delete(): void;
		equals(path: SkPath): boolean;
	}

	export default PathKitInit;
}
