class Task {
	constructor() {
		this._queue = [];
	}

	add(fn) {
		this._queue.push(fn);
	}

	run() {
		this._queue.forEach(fn => fn());
	}
}