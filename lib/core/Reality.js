const MAX_FACTS = 100;
class Reality {
	constructor() {
		this.fact = "";
		this.factRetriever = null;
	}

	setFactRetriever(factRetriever) {
		this.factRetriever = factRetriever;
	}

	async getFact() {
		if (this.factRetriever) {
			let fact = await this.factRetriever();
			return fact;
		} else {
			throw new Error('No fact retriever set');
		}
	}

	getTime() {
		return new Date();
	}

	removeFact(fact) {
		this.facts = this.facts.filter(f => f !== fact);
	}

	// Método para actualizar la "conciencia" o contexto actual basado en los hechos
	updateContext() {
		const currentTime = new Date();
		if (currentTime.getHours() > 20 || currentTime.getHours() < 6) {
			this.addFact('timeOfDay', 'night');
		} else {
			this.addFact('timeOfDay', 'day');
		}

		if (currentTime.getDay() === 0 || currentTime.getDay() === 6) {
			this.addFact('dayOfWeek', 'weekend');
		} else {
			this.addFact('dayOfWeek', 'weekday');
		}
	}

	addFact(key, value) {
		if (this.facts.length >= MAX_FACTS) {
			this.facts.shift();
		}
		this.facts.push({ key: key, value: value });
	}
	//gets the facts as a listed text	
	getFacts() {
		let strFact = `Facts: `;
		this.facts.forEach(fact => {
			strFact += `${fact.key}: ${fact.value}, `;
		});
	}

	clearFacts() {
		this.facts = [];
	}
}

module.exports = Reality;