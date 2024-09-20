import type { ActionReturn } from 'svelte/action';
export default function resizeObserver(
	node: HTMLElement,
	callback: () => void,
): ActionReturn<() => void> {
	const callbackRef = { callback };
	const resizeObserver = new ResizeObserver(() => callbackRef.callback());
	resizeObserver.observe(node);
	return {
		update(updatedCallback) {
			callbackRef.callback = updatedCallback;
		},
		destroy() {
			resizeObserver.disconnect();
		},
	};
}
