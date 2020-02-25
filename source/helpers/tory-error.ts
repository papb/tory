export class ToryError<T> extends Error {
	innerError?: Error;
	sourceInstance?: T;
}
