export class AsyncLock {
	#locked = false;
	#awaitable = Promise.resolve();

	get locked() {
		return this.#locked;
	}

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

	wait() {
		if (this.#isSet) return Promise.resolve();

		return new Promise((resolve) => {
			this.#waitResolvers.push(resolve);
		});
	}

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

	clear() {
		this.#isSet = false;
	}
}
