let api_url = "http://solsrv10:8080"

let MODEL_NAME = "llama3.2";
const fetch = require('node-fetch');

class BrainConnector {
	constructor() {
		this.queryEngine = null;
	}

	//TODO: Fucking ugly, I know. Fix later
	async initialize() {

	}
	validateThought(thought) {
		return true;
	}
	async sendThoughtToBrain(thought) {
		let response = await query(thought);
		return response;
	}

	addKnowledgeToBrain(knowledge) {
		this.contextChatEngine.addKnowledge(knowledge);
	}
}


async function query(prompt) {
	const headers = {
		'Content-Type': 'application/json'
	};
	const data = {
		model: MODEL_NAME,
		prompt: prompt,
		options: {
			//seed: 1337,
			//temperature: 1,
			// num_ctx: 100,			
			// stop: ["\n"]
		}
	};
	let url = `${api_url}/api/generate`
	const response = await fetch(url, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	});

	const result = await responseAsSimpleText(response)
	// result has an array of jsons, we need to split them
	//clears the vscode console
	console.log("\x1b[31m%s\x1b[0m", prompt);
	console.log("\x1b[33m%s\x1b[0m", result);

	return result;
}

async function responseAsSimpleText(response) {
	// Convertir la respuesta a texto
	let input = await response.text();

	// Dividir el texto en partes usando el carácter de nueva línea
	let parts = input.split("\n");

	// Filtrar las partes vacías
	parts = parts.filter(part => part.trim() !== "");

	// Parsear cada parte como JSON y extraer el valor de la clave `response`
	let responses = parts.map(part => {
		let json = JSON.parse(part);
		return json.response;
	});

	// Concatenar todos los valores de `response` en un solo string
	let result = responses.join("");

	// Devolver el string concatenado
	return result;
}


module.exports = BrainConnector;
