const MAX_SECS_TO_KEEP = 60;
const MAX_ITEMS = 1000;
const Templates = require('./Templates.js');

class LongTermMemory {
	constructor() {
		this.memoryStore = {};
	}

	clearThoughts() {
		this.memoryStore = {};
	}

	addThought(tag, thought) {
		let key = new Date().getTime();
		this.memoryStore[key] = `${tag}-${thought}`;
	}

	addFact(tag, thought) {
		let key = new Date().getTime();
		this.memoryStore[key] = `${tag}-${thought}`;
	}

	//returns and deletes the thought
	getRandomThought() {
		let keys = this.getKeys();
		let randomKey = keys[Math.floor(Math.random() * keys.length)];
		let thought = this.get(randomKey);
		this.forget(randomKey);
		return thought;
	}

	getKeys() {
		return Object.keys(this.memoryStore);
	}


	//A diferencia de ShortTermMemory, este método no borra los pensamientos, ya que la memoria de largo plazo 
	//es selectiva y no volátil
	getFact(language = 'ENGLISH') {
		let m = Templates.LONG_TERM_MEMORY_FACT[language]
		let keys = this.getKeys();
		let thoughts = [];

		keys.forEach((key, index, array) => {
			let tag = this.memoryStore[key].split('-')[0];
			let thoughtTemplate = Templates.LONG_TERM_MEMORY_FACT_ENTRY[language];
			let thought = thoughtTemplate.replace('{{TIME}}', key).replace('{{THOUGHT}}', this.memoryStore[key]).replace('{{TAG}}', tag);

			thoughts.push(thought);
		});
		if (thoughts.length > 0) {
			m += `\n${thoughts.join("\n")}`;
		} else {
			return null;
		}

		return m;
	}


	forgetEverything() {
		this.memoryStore = {};
	}

}


module.exports = LongTermMemory;