const LongTermMemory = require('./LongTermMemory.js');
const ShortTermMemory = require('./ShortTermMemory.js');
const Reality = require('./Reality.js');
const Dream = require('./Dream.js');
const BrainConnector = require('../llm_helpers/BrainConnector.js');
const BASE_PATH = require('path').resolve(__dirname + '/../../');
const fs = require('fs');
const DEFAULT_INITIAL_THOUGHTS = [];
const DEFAULT_INITIAL_FACTS = [];
const helpers = require('../helpers/helpers.js');
const e = require('express');
const Sense = require('../core/Sense');
const { get } = require('http');
const Templates = require('./Templates.js');
const THOUGHT_STRUCTURE_TEMPLATE = Templates.CONCIOUSNESS_THOUGHT_STRUCTURE['ENGLISH'];
const TaskManager = require('./TaskManager.js');
class Consciousness {
	constructor(name) {
		//we need set the consciousness to this instance for the senses to work
		this.TaskManager = new TaskManager();
		this.Consciousness = this;
		this.LTM = new LongTermMemory();
		this.STM = new ShortTermMemory();
		this.Reality = new Reality();
		this.Dream = new Dream();
		this.Skills = [];
		this.Tools = [];
		this.Messages = [];
		this.Senses = [];
		this.OutputChannels = {};
		this.isThinking = false;
		this.name = name || 'Agent-001';
		//this is the brain connector that connects the agent to the llm
		this.BrainConnector = new BrainConnector();
	}

	receiveMessageFromSense(message) {
		let thought = `MessageFromSense:{
		 					sense:${message.from}
							content: ${message.content}
						}`;
		this.STM.addThought(thought);
	}

	async getOutputChannelsFact() {
		if (this.OutputChannels.length === 0) {
			return Templates.NO_OUTPUT_CHANNELS_FOUND['ENGLISH'];
		} else {
			let m = Templates.OUTPUT_CHANNELS_FACT['ENGLISH'];
			let channels = [];
			Object.keys(this.OutputChannels).forEach((key, index) => {
				let channel = `${index + 1}- ${key}`;
				channels.push(channel);
			});
			m += `\n${channels.join("\n")}`;
			return m;
		}
	}

	async init() {
		//load the initial thoughts and facts
		let initialThoughts = DEFAULT_INITIAL_THOUGHTS;
		let initialFacts = DEFAULT_INITIAL_FACTS;
		//init the agent with some initial thoughts and facts
		initialThoughts.forEach(thought => {
			this.LTM.addThought(thought);
		});
		initialFacts.forEach(fact => {
			this.LTM.addFact(fact);
		});

		await this.loadSkills();
		await this.loadTools();
		try {
			await this.loadSenses();
			await this.loadOutputChannels();
		} catch (e) {
			console.log(e);
		}

		await this.BrainConnector.initialize();
		//TODO: Todo esto deberia ser una parte de la clase Reality, y tener un metodo getFact que devuelva el hecho en un formato legible

		//"Cogito, ergo sum": I think, therefore I am - René Descartes
		this.LTM.addThought(Templates.AGENT_FIRST_LTM_THOUGHT['ENGLISH']);
		this.STM.addThought(Templates.AGENT_FIRST_STM_THOUGHT['ENGLISH']);

		//fill the thought structure template with the necessary information
		let that = this;
		let factRetriever = async function () {
			let fact = await helpers.fillTemplate(THOUGHT_STRUCTURE_TEMPLATE, {
				CONSCIOUSNESS_CLASS_DESCRIPTION: await helpers.getClassAsDescription(BASE_PATH + '/lib/core/Consciousness.js'),
				CLASSES_INTERFACES: await helpers.getClassesInterfacesAsDescription(BASE_PATH),
				//LTM_FACT: this.LTM.getFact(),
				LTM_FACT: that.LTM.getFact(),
				STM_FACT: that.STM.getFact(),
				AGENT_NAME: `Tu nombre es ${that.name}`,
				OUTPUT_CHANNELS_FACT: await that.getOutputChannelsFact(),
				SET_AGENT_MISSION_PROMPT: Templates.AGENT_MISSION_PROMPT['ENGLISH']
			});
			return fact;
		}

		this.Reality.setFactRetriever(factRetriever);
		this.keepThinking()

		//start the main loop of the agent
		console.log('Agent initialized...');
	}

	imAlive() {
		console.log('Agent is alive, waiting for thoughts or stimuli...');
	}

	loadSenses() {
		return new Promise((resolve, reject) => {
			let SENSES_PATH = BASE_PATH + '/lib/senses';
			fs.readdir(SENSES_PATH, (err, files) => {
				if (err || !files) {
					console.log('No senses found, continuing...');
					return resolve();
				}
				files.forEach(file => {
					let sense = require(`${SENSES_PATH}/${file}`);
					//only load .js files
					if (file.endsWith('.js')) {
						let senseInstance = new sense(this.Consciousness);
						senseInstance.init();
						this.Senses.push(senseInstance);
					}
				});
				resolve();
			});
		});
	}

	loadOutputChannels() {
		return new Promise((resolve, reject) => {
			let OUTPUT_CHANELS_PATH = BASE_PATH + '/lib/outputChannels';
			fs.readdir(OUTPUT_CHANELS_PATH, (err, files) => {
				if (err || !files) {
					console.log('No outputChannels found, continuing...');
					return resolve();
				}
				files.forEach(file => {
					let outputChannel = require(`${OUTPUT_CHANELS_PATH}/${file}`);
					let outputChannelInstance = new outputChannel(this.Consciousness);
					outputChannelInstance.init();
					this.OutputChannels[outputChannelInstance.getName()] = outputChannelInstance;
				});
				resolve();
			});
		});
	}


	async loadSkills() {
		//traverses the skills folder and loads all the skills, then adds them to the agent's skills
		let SKILL_PATH = BASE_PATH + '/lib/skills';
		fs.readdirSync(SKILL_PATH, (err, files) => {
			if (err || !files) {
				console.log('No skills found, continuing...');
				return;
			}
			files.forEach(file => {
				let skill = require(`${SKILL_PATH}/${file}`);
				this.Skills.push(skill);
			});
		});
	}

	//This is the main loop of the agent
	//description: the agent keeps thinking by getting the last thought from the short term memory and processing it
	//then it waits for a while before thinking again
	async keepThinking() {
		//get the last thought from the short term memory
		if (this.isThinking) {
			return;
		}
		let lastThought = this.STM.getFact(false);
		//process the last thought
		if (lastThought) {
			this.isThinking = true;

			let itWorks = false;
			let maxTries = 10;
			while (!itWorks && maxTries-- > 0) {
				let fact = await this.Reality.getFact();
				try {
					await this.processThought(fact);
					itWorks = true;
				} catch (e) {
					console.log(`Error processing thought: ${lastThought}`);
					console.log(e);
					this.STM.addThought(`Error processing last thought: "${lastThought}" the error was: ${e}`);
				}
			}

		}
		//wait for a while before thinking again
		setTimeout(() => {
			this.keepThinking();
		}, 100);

	}

	getName() {
		return this.name;
	}

	//this is the point where we contact the llm and chat with it
	async processThought(fact) {
		//asegurarse de que la primera vez sea siempre un pensamiento en blanco
		if (!fact || fact == '') {
			this.isThinking = false;
			return;
		}
		let response = await this.BrainConnector.sendThoughtToBrain(fact);
		//Response is always a JAvascript code, so we evaluate it		
		try {
			//we need to get the string inside <though_as_code></though_as_code> tags
			//response is a string
			//need to get all the code inside ===JS_THOUGH_AS_CODE=== and ===JS_THOUGH_AS_CODE=== tags
			let regex = /===START_JS_CODE===([\s\S]*?)===END_JS_CODE===/g;
			if (!regex.test(response)) {
				console.log(`No thought as code found in response`);
				this.isThinking = false;
				return;
			}
			let code = response.match(/\START_JS_CODE===(.*)===END_JS_CODE/s)[1];
			console.log(`***********Ejecutando ***********`);
			console.log(code);
			eval(code);
		} catch (e) {
			console.log(`***********Error ejecutando ***********`);
			console.log(response);
			console.log(`*********** Dump ***********`);
			console.log(e);
			console.log(`*********** Fin ***********`);
			throw e;
		}

		this.isThinking = false;
	}

	async loadTools() {
		let TOOLS_PATH = BASE_PATH + '/lib/tools';
		//traverses the tools folder and loads all the tools, then adds them to the agent's tools
		fs.readdirSync(TOOLS_PATH, (err, files) => {
			if (err || !files) {
				console.log('No tools found, continuing...');
				return;
			}
			files.forEach(file => {
				let tool = require(`${TOOLS_PATH}/${file}`);
				this.Tools.push(tool);
			});
		});
	}

	// Returns the long-term memory
	getLTM() {
		return this.LTM;
	}

	// Returns the short-term memory
	getSTM() {
		return this.STM;
	}

	// Returns the reality
	getReality() {
		return this.Reality;
	}

	// Returns the dream
	getDream() {
		return this.Dream;
	}

	//Die in the reality
	die() {
		this.Reality.addFact('I am dead');
	}

	//Sleep in the reality
	sleep() {
		this.Reality.addFact('I am sleeping');
	}

	//Wake up in the reality
	wake() {
		this.Reality.addFact('I am awake');
	}

	//Dream in the reality
	dream() {
		this.Reality.addFact('I am dreaming');
	}

	getSkills() {
		return this.Skills;
	}

	getTools() {
		return this.Tools;
	}

}

module.exports = Consciousness;