const { Config, initEnv } = require("docenv");
initEnv(require("../docenv-config.js"));


const Consiuosness = require('./core/Consciousness.js');

//Stores this file's interfaces
class SolunikaAgent extends Consiuosness {
	//constructor
	constructor() {
		super("Solúnika");
	}

}

module.exports = SolunikaAgent