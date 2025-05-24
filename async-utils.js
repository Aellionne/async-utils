/** An asynchronous lock (mutex). */
export class AsyncLock {
	#locked = false;
	#awaitable = Promise.resolve();

	get locked() {
		return this.#locked;
	}

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
	async acquire() {
		const previousAwaitable = this.#awaitable;

		/** @type {{ promise: Promise<void>; resolve: () => void; }} */
		const { promise, resolve } = Promise.withResolvers();

		this.#awaitable = promise;
		const release = () => {
			this.#locked = false;
			resolve();
		};

		await previousAwaitable;
		this.#locked = true;

		return { release, [Symbol.dispose]: release };
	}
}

/** An asynchronous signal-based event. */
export class AsyncEvent {
	#isSet;
	/**
	 * @type {(() => void)[]}
	 */
	#waitResolvers = [];

	constructor(set = false) {
		this.#isSet = set;
	}

	get isSet() {
		return this.#isSet;
	}

	/**
	 * Returns a resolved `Promise` if event is already *set*.
	 * Otherwise, returns a `Promise` that will only resolve when `set` is called.
	 * @returns {Promise<void>}
	 */
	wait() {
		if (this.#isSet) return Promise.resolve();

		return new Promise((resolve) => {
			this.#waitResolvers.push(resolve);
		});
	}

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
	set() {
		this.#isSet = true;

		for (
			let resolve = this.#waitResolvers.shift();
			resolve !== undefined;
			resolve = this.#waitResolvers.shift()
		) {
			resolve();
		}
	}

	/** Sets internal *set* flag to `false`. */
	clear() {
		this.#isSet = false;
	}
}
