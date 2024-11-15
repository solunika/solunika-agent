const OpenAI = require('openai');

class BrainConnector {
	constructor() {
		this.client = null;
		this.initialize();
	}

	async initialize() {
		try {
			this.client = new OpenAI({
				apiKey: process.env.NVIDIA_API_KEY,
				baseURL: process.env.NVIDIA_BASE_URL
			});
		} catch (error) {
			console.error("Error al inicializar OpenAI:", error);
			// Manejo adicional del error si es necesario
		}
	}

	validateThought(thought) {
		return true;
	}

	async sendThoughtToBrain(thought) {
		try {
			let response = await this.query(thought);
			return response;
		} catch (error) {
			console.error('Error al enviar el pensamiento al cerebro:', error);
			throw error;
		}
	}

	addKnowledgeToBrain(knowledge) {
		// No se usa en este ejemplo
	}

	async query(prompt) {
		try {
			const completion = await this.client.chat.completions.create({
				model: "nvidia/llama-3.1-nemotron-70b-instruct",
				messages: [{ role: "user", content: prompt }],
				temperature: 0.5,
				top_p: 1,
				max_tokens: 1024,
				stream: true,
			});

			let result = '';
			for await (const chunk of completion) {
				result += chunk.choices[0]?.delta?.content || '';
			}

			console.log("\x1b[31m%s\x1b[0m", prompt);
			console.log("\x1b[33m%s\x1b[0m", result);

			return result;
		} catch (error) {
			console.error('Error al enviar el pensamiento al cerebro:', error);
			throw error;
		}
	}
}

module.exports = BrainConnector;
