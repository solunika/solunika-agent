//from llama_index.embeddings import InstructorEmbedding

let { Document, VectorStoreIndex, SimpleWebPageReader, ContextChatEngine, DefaultContextGenerator, OpenAI, Ollama, Settings } = require("llamaindex");
//const ollama = new Ollama({ model: "llama3", temperature: 0.75 });

// Defined available models
// Currently available models are: "llama3", "gpt-4"
const MODEL_ENGINE_NAME = "ollama";
const OLLAMA_MODEL_NAME = "llama3";
const MAX_TOKENS = 5000;
const MODEL_ENGINE_OLLAMA = "ollama";
const MODEL_ENGINE_GPT4 = "gpt-4";
class BrainConnector {
	constructor() {
		this.queryEngine = null;
	}

	//TODO: Fucking ugly, I know. Fix later
	async initialize() {
		if (MODEL_ENGINE_NAME === MODEL_ENGINE_GPT4) {
			let knowledgeData = ["test"];
			const documents = knowledgeData.map(entry => new Document({ text: entry }));
			let index = await VectorStoreIndex.fromDocuments(documents);
			let retriever = index.asRetriever();
			let chatModel = new OpenAI({ model: "gpt-4" });
			let contextChatEngine = new ContextChatEngine({ chatModel: chatModel, retriever: retriever });
	
			const brainConnector = new BrainConnector();
			brainConnector.chatModel = chatModel;
			brainConnector.contextChatEngine = contextChatEngine;
			this.queryEngine = brainConnector;

		} else if (MODEL_ENGINE_NAME===MODEL_ENGINE_OLLAMA){
			const ollama = new Ollama({ model: OLLAMA_MODEL_NAME, temperature: 1 });
			Settings.llm = ollama;
			Settings.embedModel = ollama;
			let knowledgeData = ["test"];
			const documents = knowledgeData.map(entry => new Document({ text: entry, id_: entry }));
			let index = await VectorStoreIndex.fromDocuments(documents);
			let retriever = await index.asRetriever();
			
			// Create a query engine
			let queryEngine = await index.asQueryEngine({
				retriever,
			});
	
			this.queryEngine = queryEngine;									
		}
	}
	validateThought(thought) {
		if (this.queryEngine === null) {
			//set console conlog color
			console.log(`The brain is not initialized, needs a queryEngine`);
			return false;
		}

		if (thought === "" || thought === null || thought === undefined || thought.length === 0) {
			console.log(`Invalid thought: Empty`);
			return false;
		}

		if (thought.length > MAX_TOKENS) {
			console.log(`Invalid thought: Exceeded max tokens`);
			return false;
		}
	}
	async sendThoughtToBrain(thought) {
		if (this.validateThought(thought) === false) {
			return;
		} else {
			console.log(`*****************************************`);
			console.log(`User: ${thought}`);
			console.log(`*****************************************`);
			let response = null;
			if (MODEL_ENGINE_NAME === MODEL_ENGINE_OLLAMA) {
				response = await this.queryEngine.query({ query: thought });
				return `${response}`;
			} else if (MODEL_NAME === MODEL_ENGINE_GPT4) {
				response = await this.queryEngine.contextChatEngine.chat(thought);
			}			

			console.log(`--------------`);
			console.log(`Agent: ${response}`);
			console.log(`--------------`);
			return `${response}`
		}
	}

	addKnowledgeToBrain(knowledge) {
		this.contextChatEngine.addKnowledge(knowledge);
	}
}

module.exports = BrainConnector;
