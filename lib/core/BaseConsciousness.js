class BaseConsciousness {
	constructor() {
		this.name = 'BaseConsciousness';
	}

	receiveMessageFromSense(message) {
		throw new Error('Method not implemented');
	}

	sendMessageToBrain(message) {
		throw new Error('Method not implemented');
	}

	receiveMessageFromBrain(message) {
		throw new Error('Method not implemented');
	}

	init() {
		throw new Error('Method not implemented');
	}

	getSkill(skillName) {
		throw new Error('Method not implemented');
	}
}

module.exports = BaseConsciousness;