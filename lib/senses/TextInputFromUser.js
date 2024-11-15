const Sense = require('../core/Sense');
const Message = require('../core/Message');
class TextInputFromUser extends Sense {
	constructor(consciousness) {
		let description = 'Get text input from user';
		super(description, consciousness);
	}

	init() {
		console.log('TextInputFromUser interface is being initialized...');
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (text) => {
			let from = 'TextInputFromUser';
			let content = text;

			let message = new Message(from, content);
			console.log('Message received: ' + message.getContent());
			this.sendMessageToBrain(message);			
		});

	}
}

module.exports = TextInputFromUser;