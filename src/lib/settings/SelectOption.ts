import type { MessageID } from '../../intl';

export type SelectOption =
	| {
			id: string;
			name: MessageID;
			literalName?: never;
			group?: MessageID;
	  }
	| {
			id: string;
			name?: never;
			literalName: string;
			group?: MessageID;
	  };
