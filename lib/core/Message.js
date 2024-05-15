class Message {
	//constructor:
	//from: the sender of the message
	//content: the content of the message
	constructor(from, content) {
		this.from = from;
		this.content = content;
	}

	getFrom() {
		return this.from;
	}

	getContent() {
		return this.content;
	}

	reply(content) {
		return new Message(this.from, content);
	}

}

module.exports = Message;