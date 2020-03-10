import hasha = require('hasha');

export function hashMultiple(...args: string[]): string {
	return hasha(args.join('-tory-pepper-'), { algorithm: 'sha256' });
}
