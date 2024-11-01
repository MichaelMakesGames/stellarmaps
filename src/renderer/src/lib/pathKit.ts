import PathKitInit from 'pathkit-wasm/bin/pathkit';
import pathKitWasm from 'pathkit-wasm/bin/pathkit.wasm?url';

export const pathKitPromise = PathKitInit({ locateFile: () => pathKitWasm });
