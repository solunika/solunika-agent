const OutputChannel = require('../core/OutputChannel');
class Speech extends OutputChannel {
	constructor(consiousness) {
		let description = 'Use speech to communicate with user';
		super(description, consiousness);
		this.isSpeaking = false;
		this.messagesBuffer = [];
	}

	getMessagesBuffer() {
		return this.messagesBuffer;
	}

	addMessageToBuffer(message) {
		this.messagesBuffer.push(message);
	}

	getMessagesBuffer() {
		return this.messagesBuffer;
	}

	init() {
		console.log('Speech interface is being initialized...');
		this.startSpeech();
	}
	write(message) {
		console.log(`\x1b[33m${message}\x1b[0m`);
		//uses osx system voice to speak
		this.addMessageToBuffer(message);
	}

	setIsSpeaking(isSpeaking) {
		this.isSpeaking = isSpeaking;
	}

	startSpeech() {
		//revisa si tienes algo para decir en tu lista de mensajes, cada 10 ms y lo dice, sino se queda esperando
		setInterval(async () => {
			if (this.getMessagesBuffer().length > 0 && !this.isSpeaking) {
				this.setIsSpeaking(true);
				let message = this.getMessagesBuffer().shift();
				let say = require('say');
				await say.speak(message);
				this.setIsSpeaking(false);
			} else {
				this.setIsSpeaking(false);
			}
		}, 10);
	}
}

module.exports = Speech;