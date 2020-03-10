export class RandomStringBuilder {
	private readonly _pastValues: string[] = [];

	constructor(public readonly repetitionOdds: number) {}

	next(): string {
		if (this._pastValues.length > 0 && Math.random() < this.repetitionOdds) {
			const index = Math.floor(Math.random() * this._pastValues.length);
			return this._pastValues[index];
		}

		const result = this._pureRandom();
		this._pastValues.push(result);
		return result;
	}

	nextArray(length: number): string[] {
		const result: string[] = [];
		for (let i = 0; i < length; i++) {
			result.push(this.next());
		}

		return result;
	}

	private _pureRandom(): string {
		const result = `${Math.random()}`.slice(2);

		if (this._pastValues.includes(result)) {
			return this._pureRandom();
		}

		return result;
	}
}
