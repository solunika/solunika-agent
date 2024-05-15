class Dream {
	constructor() {
		this._dream = null;
	}

	setDream(dream) {
		this._dream = dream;
	}

	getDream() {
		return this._dream;
	}
}

module.exports = Dream;