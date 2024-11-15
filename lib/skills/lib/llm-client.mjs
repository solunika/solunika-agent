export default class LLMClient {
	constructor(config) {
		console.log('LLM Client inicializado');
	}
	generateResponse(text) {
		console.log('Generando respuesta para:', text);
		return Promise.resolve('Respuesta simulada del LLM');
	}
}
