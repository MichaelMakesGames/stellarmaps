import type { ToastSettings, getToastStore } from '@skeletonlabs/skeleton';

export function toastError<T>(options: {
	title: string;
	description?: string;
	defaultValue: T;
	toastStore: ReturnType<typeof getToastStore>;
	action?: ToastSettings['action'];
}): (reason: unknown) => T {
	return (reason: unknown) => {
		options.toastStore.trigger({
			message: `
				<h4 class="h4">${options.title}</h4>
				${options.description ? `<div>${options.description}</div>` : ''}
				<pre class="bg-error-700 p-2 my-2 rounded whitespace-pre-line break-all">${reason}</pre>
			`,
			autohide: false,
			action: options.action,
		});
		return options.defaultValue;
	};
}

export function wait(ms: number): Promise<never> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseNumberEntry<T>(entry: [string, T]): [number, T] {
	return [parseInt(entry[0]), entry[1]];
}

export function isDefined<T>(value: T | null | undefined): value is T {
	return value != null;
}

export function timeIt<Args extends unknown[], ReturnValue>(
	message: string,
	fn: (...args: Args) => ReturnValue,
	...args: Args
) {
	console.log(`START: ${message}`);
	console.time(`END:   ${message}`);
	const result = fn(...args);
	console.timeEnd(`END:   ${message}`);
	return result;
}

export async function timeItAsync<Args extends unknown[], ReturnValue>(
	message: string,
	fn: (...args: Args) => Promise<ReturnValue>,
	...args: Args
) {
	console.log(`START: ${message}`);
	console.time(`END:   ${message}`);
	const result = await fn(...args);
	console.timeEnd(`END:   ${message}`);
	return result;
}

export function debounce(fn: () => void, ms: number) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	return () => {
		if (timeoutId != null) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			fn();
			timeoutId = null;
		}, ms);
	};
}
