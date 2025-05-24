/** An asynchronous lock (mutex). */
declare class AsyncLock {
	get locked(): boolean;

	/**
	 * Blocks execution until the lock is acquired and returns an object with a `release` function.
	 * For convenience, the `release` function is also called at the end of scope when declared with `using`.
	 * @example
	 * const lock = new AsyncLock();
	 * const { release } = await lock.acquire();
	 * try {
	 * 	// CRITICAL SECTION
	 * } finally {
	 * 	release();
	 * }
	 * @example
	 * const lock = new AsyncLock();
	 * {
	 * 	using _ = await lock.acquire();
	 * 	// CRITICAL SECTION
	 * }
	 */
	acquire(): Promise<{ release: () => void; [Symbol.dispose]: () => void }>;
}

/** An asynchronous signal-based event. */
declare class AsyncEvent {
	constructor(set?: boolean);

	get isSet(): boolean;
	/**
	 * Returns a resolved `Promise` if event is already *set*.
	 * Otherwise, returns a `Promise` that will only resolve when `set` is called.
	 */
	wait(): Promise<void>;

	/**
	 * Sets the internal *set* flag to `true` and resolves all `Promise`s waiting on the event.
	 * @example
	 * const event = new AsyncEvent(false);
	 * const waitTask = async (id) => {
	 * 	console.log(`Wait Task ${id}: Waiting...`);
	 * 	await event.wait();
	 * 	console.log(`Wait Task ${id}: Awakened!`);
	 * }
	 * waitTask(1);
	 * waitTask(2);
	 *
	 * console.log("Simulating critical section...");
	 * setTimeout(() => {
	 * 	console.log("Critical section complete!");
	 * 	event.set();
	 * }, 3000);
	 */
	set(): void;

	/** Sets internal *set* flag to `false`. */
	clear(): void;
}

export { AsyncLock, AsyncEvent };
