const Skill = require('../core/Skill');
class BrowseWeb extends Skill {
	constructor(consciousness) {
		let description = `Allows browsing and interacting with web pages. Accepts JSON commands:
		
		Navigation:
		{"command": "navigate", "url": "[URL]"} - Navigate to specified URL
		{"command": "executeOnActiveTab", "script": "goBack"} - Go back one page
		{"command": "executeOnActiveTab", "script": "goForward"} - Go forward one page
		
		Page Interaction:
		{"command": "executeOnActiveTab", "script": "type '[text]' in [element]"} - Type text into specified element
		{"command": "executeOnActiveTab", "script": "clickButton '[button text]'"} - Click button with specified text
		{"command": "modifyDOM", "script": "[javascript]"} - Execute arbitrary JavaScript on page
		
		Example:
		{"command": "navigate", "url": "https://google.com"}
		{"command": "executeOnActiveTab", "script": "type 'weather' in searchbox"}
		{"command": "executeOnActiveTab", "script": "clickButton 'Google Search'"}
		`

		super(description, consciousness);
	}

	init() {
		try {
			console.log('BrowseWeb skill is being initialized...');
			this.server = require('./BrowseWeb/server.js');
			//this.server.init();
		} catch (error) {
			console.error('Error initializing BrowseWeb skill:', error);
		}
	}

	perform(parameters) {
		try {
			this.server.pushCommand(parameters);
			console.log('BrowseWeb skill performing with parameters:', parameters);
		} catch (error) {
			console.error('Error performing BrowseWeb skill:', error);
			throw error;
		}
	}

	receiveMessageFromBrain(message) {
		try {
			console.log('BrowseWeb skill received message from brain:', message);
		} catch (error) {
			console.error('Error receiving message in BrowseWeb skill:', error);
			throw error;
		}
	}

	sendMessageToBrain(message) {
		try {
			console.log('BrowseWeb skill sending message to brain:', message);
			super.sendMessageToBrain(message);
		} catch (error) {
			console.error('Error sending message in BrowseWeb skill:', error);
			throw error;
		}
	}
}

module.exports = BrowseWeb;