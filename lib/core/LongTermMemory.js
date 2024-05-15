const MAX_SECS_TO_KEEP = 60;
const MAX_ITEMS = 1000;
const Templates = require('./Templates.js');

class LongTermMemory {
	constructor() {
		this.memoryStore = {};
	}

	addThought(thought) {
		let key = new Date().getTime();
		this.memoryStore[key] = thought;
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
		let m = Templates.LONG_TERM_MEMORY_FACT[language];
		let keys = this.getKeys();
		let thoughts = [];
		if (keys.length === 0) {
			return m + Templates.NO_THOUGHTS_IN_LONG_TERM_MEMORY[language];
		}

		keys.forEach((key, index) => {
			let thought = `${index + 1}- ${this.memoryStore[key]}`;
			thoughts.push(thought);
		});
		if (thoughts.length > 0) {
			m += `\n${thoughts.join("\n")}`;
		} else {
			return Templates.NO_THOUGHTS_IN_LONG_TERM_MEMORY[language];
		}

		return m;
	}

	forgetEverything() {
		this.memoryStore = {};
	}

}


module.exports = LongTermMemory;