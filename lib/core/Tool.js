class Tool {
	constructor(name, purpose, howToUse) {
		this.name = 'Tool';
		this.purpose = 'Purpose';
		this.howToUse = 'How to use';
	}

	useTool() {
		console.log('Using tool');
		this.use();
	}


	getName() {
		return this.name;
	}

	getPurpose() {
		return this.purpose;
	}

	getHowToUse() {
		return this.howToUse;
	}

}