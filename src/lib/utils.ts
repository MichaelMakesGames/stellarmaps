import type { getToastStore } from '@skeletonlabs/skeleton';

export function toastError<T>(options: {
	title: string;
	defaultValue: T;
	toastStore: ReturnType<typeof getToastStore>;
}): (reason: unknown) => T {
	return (reason: unknown) => {
		options.toastStore.trigger({
			message: `
        <h4 class="h4">${options.title}</h4>
        <pre class="bg-error-700 p-2 my-2 rounded">${reason}</pre>
        <p>At this time, StellarMaps only supports the Steam version of Stellaris. If you are using the Steam version, please file a bug report.</p>
      `,
			autohide: false,
		});
		return options.defaultValue;
	};
}

export function wait(ms: number): Promise<never> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
