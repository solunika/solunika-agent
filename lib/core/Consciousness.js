const LongTermMemory = require('./LongTermMemory.js');
const ShortTermMemory = require('./ShortTermMemory.js');
const Reality = require('./Reality.js');
const Dream = require('./Dream.js');
const BrainConnector = require('../llm_helpers/BrainConnector.js');
const BASE_PATH = require('path').resolve(__dirname + '/../../');
const fs = require('fs');
const DEFAULT_INITIAL_THOUGHTS = [];
const DEFAULT_INITIAL_FACTS = ['El idioma de preferencia del usuario es español'];
const helpers = require('../helpers/helpers.js');
const e = require('express');
const Sense = require('../core/Sense');
const { get } = require('http');
const Templates = require('./Templates.js');
const BaseConsciousness = require('./BaseConsciousness.js');
const THOUGHT_STRUCTURE_TEMPLATE = Templates.CONCIOUSNESS_THOUGHT_STRUCTURE['ENGLISH'];
//const TaskManager = require('./TaskManager.js');
class Consciousness extends BaseConsciousness {
	constructor(name) {
		//we need set the consciousness to this instance for the senses to work
		// this.TaskManager = new TaskManager();
		super(name);
		this.Consciousness = this;
		this.LTM = new LongTermMemory();
		this.STM = new ShortTermMemory();
		this.Reality = new Reality();
		this.Dream = new Dream();
		this.Skills = [];
		this.Tools = [];
		this.Senses = [];
		this.OutputChannels = {};
		this.isThinking = false;
		this.name = name || 'Agent-001';
		//this is the brain connector that connects the agent to the llm
		this.BrainConnector = new BrainConnector();
	}

	receiveMessageFromSense(message) {
		let thought = `**ATENTION** MessageFromInputChannel: {senseName:'${message.from}' content: '${message.content}' }`;
		this.STM.addThought('message_from_sense', thought);
	}

	async getOutputChannelsFact() {
		if (this.OutputChannels.length === 0) {
			return Templates.NO_OUTPUT_CHANNELS_FOUND['ENGLISH'];
		} else {
			let m = Templates.OUTPUT_CHANNELS_FACT['ENGLISH'];
			let channels = [];
			Object.keys(this.OutputChannels).forEach((key, index) => {
				let outputChannelTemplate = Templates.OUTPUT_CHANNELS_FACT_ENTRY['ENGLISH'];
				let channel = outputChannelTemplate.replace('{{NAME}}', key);

				channels.push(channel);
			});
			m += `\n${channels.join("\n")}`;
			return m;
		}
	}

	async getSensesFact() {
		if (this.Senses.length === 0) {
			return Templates.NO_SENSES_FOUND['ENGLISH'];
		} else {
			let m = Templates.AGENT_SENSES['ENGLISH'];
			let senses = [];
			this.Senses.forEach((sense, index) => {
				let senseTemplate = Templates.SENSES_FACT_ENTRY['ENGLISH'];
				let senseEntry = senseTemplate.replace('{{NAME}}', sense.getName());
				senses.push(senseEntry);
			}
			);
			m += `\n${senses.join("\n")}`;
			return m;
		}
	}

	async init() {
		//load the initial thoughts and facts
		let initialThoughts = DEFAULT_INITIAL_THOUGHTS;
		let initialFacts = DEFAULT_INITIAL_FACTS;
		//init the agent with some initial thoughts and facts
		initialThoughts.forEach(thought => {
			this.LTM.addThought('agent_thought', thought);
		});
		initialFacts.forEach(fact => {
			this.LTM.addFact('agent_fact', fact);
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
		this.LTM.addThought('agent_thought', Templates.AGENT_FIRST_LTM_THOUGHT['ENGLISH']);
		this.STM.addThought('agent_thought', Templates.AGENT_FIRST_STM_THOUGHT['ENGLISH']);

		//fill the thought structure template with the necessary information
		let that = this;
		let factRetriever = async function () {
			let fact = await helpers.fillTemplate(THOUGHT_STRUCTURE_TEMPLATE, {
				LTM_FACT: that.LTM.getFact(),
				STM_FACT: that.STM.getFact(),
				OUTPUT_CHANNELS_FACT: await that.getOutputChannelsFact(),
				AGENT_NAME: `${that.name}`,
				SET_AGENT_MISSION_PROMPT: Templates.AGENT_MISSION_PROMPT['ENGLISH'],
				AGENT_SENSES: await that.getSensesFact(),
				SKILLS_FACT: await that.getSkillsFact(),
			});
			return fact;
		}

		this.Reality.setFactRetriever(factRetriever);
		this.keepThinking()

		//start the main loop of the agent
		console.log('Agent initialized...');
	}

	doNothing() {
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

	getSenses() {
		let senses = [];
		this.Senses.forEach(sense => {
			senses.push(sense.getName());
		});
		return senses;
	}

	getSkillsFact() {
		if (this.Skills.length === 0) {
			return Templates.NO_SKILLS_FOUND['ENGLISH'];
		} else {
			let m = Templates.AGENT_SKILLS['ENGLISH'];
			let skills = [];
			this.Skills.forEach((skill, index) => {
				let skillTemplate = Templates.SKILLS_FACT_ENTRY['ENGLISH'];
				let skillEntry = skillTemplate.replace('{{NAME}}', skill.getName()).replace('{{DESCRIPTION}}', skill.getDescription());
				skills.push(skillEntry);
			});

			m += `\n${skills.join("\n")}`;
			return m;
		}
	}



	getSkill(skillName) {
		return this.Skills.find(skill => skill.getName() === skillName);
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
		try {
			// Traverses the skills folder and loads all the skills, then adds them to the agent's skills
			const SKILL_PATH = BASE_PATH + '/lib/skills';

			const files = await fs.promises.readdir(SKILL_PATH);

			for (const file of files) {
				try {
					// Skip non-JS files and directories
					if (!file.endsWith('.js')) continue;

					const SkillClass = require(`${SKILL_PATH}/${file}`);
					const skillInstance = new SkillClass(this);
					await skillInstance.init();
					this.Skills.push(skillInstance);
				} catch (skillError) {
					console.error(`Error loading skill ${file}:`, skillError);
				}
			}
		} catch (err) {
			console.log('No skills found or error accessing skills directory, continuing...', err);
		}
	}

	//This is the main loop of the agent
	//description: the agent keeps thinking by getting the last thought from the short term memory and processing it
	//then it waits for a while before thinking again
	//TODO: Tendriamos que tener un mecanismo por el cual un modelo paralelo pueda ir haciendo fine-tuning del modelo principal, en un tiempo definido
	//por algún parametro. Esto nos permitiría experimentar con varios tipos de modelos y ver cual es el que mejor se adapta a las necesidades del agente
	async keepThinking() {
		//get the last thought from the short term memory
		if (this.isThinking) {
			return;
		}

		let lastThought = this.STM.getFact(false);
		//process the last thought
		if (lastThought) {
			let itWorks = false;
			let maxTries = 1000;
			while (!itWorks && maxTries-- > 0) {
				this.isThinking = true;
				let fact = await this.Reality.getFact();
				try {
					await this.processThought(fact);
					this.isThinking = false;
					itWorks = true;
				} catch (e) {
					this.isThinking = false;
					itWorks = false;
					console.log(`Error processing thought: ${lastThought}`);
					this.STM.addThought(`Error processing last thought: "${lastThought}" the error was: ${e.message}`);
					// console.log(e);
					//this is a way to avoid infinite loops						
				}
			}
			if (maxTries < 0) { //if we reach the max tries, we need to stop the agent
				this.isThinking = false;
				return;
			}
		} else {
			this.isThinking = false;
		}
		//wait for a while before thinking again

		setTimeout(() => {
			this.keepThinking();
		}, 1000);


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
		//we need to get the string inside <though_as_code></though_as_code> tags
		//response is a string
		//need to get all the code inside ===JS_THOUGH_AS_CODE=== and ===JS_THOUGH_AS_CODE=== tags
		//let regex = /===START_JS_CODE===([\s\S]*?)===END_JS_CODE===/g;
		let regex = /\`\`\`javascript([\s\S]*?)\`\`\`/g;
		let code = "";
		if (regex.test(response)) {
			code = response.match(/```javascript([\s\S]*?)```/)[1].trim();
			//console.log(`No thought as code found in response`);
			//throw new Error('Remeber the code needs to be inside ```javascript``` tags');
			//this.isThinking = false;
			//return;
		} else {
			code = response.trim();
		}
		console.log(`***********Ejecutando ***********`);
		console.log(code);
		try {
			//we generate a clone o this instance, then we provide it to the eval function
			//so the code can be executed in the context of this instance.
			//let agent = Object.assign({}, this);
			//agent.evalCodeBlock(code);

			eval(code);
			// evalCodeAgainstAgent(code, agent);					
		} catch (e) {
			console.log(`***********Error ejecutando ***********`);
			console.log(response);
			console.log(`*********** Dump ***********`);
			console.log(e);
			console.log(`*********** Fin ***********`);
			return {
				error: e,
				code: code
			}
		}

		this.isThinking = false;
	}

	evalCodeBlock(code) {
		try {
			eval(code);
		} catch (e) {
			console.log(`Error executing code block: ${code}`);
			console.log(e);
		}
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

	getOutputChannel(channelName) {
		return this.OutputChannels[channelName];
	}

}

module.exports = Consciousness;


// {"command": "navigate", "url": "https://x.com/home"}