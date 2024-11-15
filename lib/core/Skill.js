// Skill defines the basic skill for the AI to use
class Skill {
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

	perform(parameters) {
		throw new Error('Method not implemented');
	}

	sendMessageToBrain(message) {
		this.consciousness.receiveMessageFromSense(message);
	}

	receiveMessageFromBrain(message) {
		throw new Error('Method not implemented');
	}
}

module.exports = Skill;
