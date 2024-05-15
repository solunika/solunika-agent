// Senses defines the basic senses properties
class Sense {
	constructor(description, consciousness) {
		this.name = this.constructor.name;
		this.description = description;
		this.consciousness = consciousness;
	}

	getName() {
		return this.name;
	}

	getDescription() {
		return this.description;
	}

	init() {
		throw new Error('Method not implemented');
	}

	sendMessageToBrain(message) {
		this.consciousness.receiveMessageFromSense(message);
	}
}

module.exports = Sense;