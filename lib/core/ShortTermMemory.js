const MAX_SECS_TO_KEEP = 60;
const MAX_ITEMS = 1000;
const Templates = require('./Templates.js');
//TODO: 
// -La memoria de corto plazo debería tener un tiempo de vida para los pensamientos.
class ShortTermMemory {
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


	//A diferencia de LongTermMemory, este método puede borrar los pensamientos, ya que la memoria de corto plazo
	//es volátil y no selectiva
	getFact(forget = true, language = 'ENGLISH') {
		let m = Templates.SHORT_TERM_MEMORY_FACT[language]
		let keys = this.getKeys();
		let thoughts = [];

		keys.forEach((key, index, array) => {
			//let thought = `${key}-${index + 1}-${this.memoryStore[key]} \n.keys ${array}`;
			let thoughtTemplate = Templates.SHORT_TERM_MEMORY_FACT_ENTRY[language];
			let thought = thoughtTemplate.replace('{{TIME}}', key).replace('{{THOUGHT}}', this.memoryStore[key]);

			thoughts.push(thought);
		});
		if (thoughts.length > 0) {
			m += `\n${thoughts.join("\n")}`;
			if (forget) {
				this.forgetEverything();
			}
		} else {
			return null;
		}

		return m;
	}

	forgetEverything() {
		this.memoryStore = {};
	}

}


module.exports = ShortTermMemory;