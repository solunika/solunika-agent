//This is the 

class OutputChannel {
	constructor(description, consciousness) {
		this.name = this.constructor.name; //obtiene el nombre de la clase que lo hereda
		this.description = description;
		this.consciousness = consciousness;
	}

	// Returns the sense name
	getName() {
		return this.name;
	}



	// Returns the sense description
	getDescription() {
		return this.description;
	}

	init() {
		throw new Error('Method not implemented');
	}

	sendMessageToBrain(message) {
		this.consciousness.receiveMessageFromSense(message);
	}

	write(message) {
		throw new Error('Method not implemented');
	}
}

module.exports = OutputChannel;