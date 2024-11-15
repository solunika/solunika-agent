const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const listenPort = 7001;

const app = express();
app.use(bodyParser.json());
let commandData = "{command:''}";
let commands = [];
const COMMANDS = {
	EMPTY_COMMAND: { command: 'nop' }
};

app.post('/', (req, res) => {
	const { command, url } = req.body;

	if (command === 'navigate') {
		// Enviar el comando al plugin Brave (simulación, ya que la comunicación directa desde el servidor a la extensión no es posible)
		axios.post(`http://localhost:${listenPort}/command`, {
			command: 'navigate',
			url: url
		})
			.then(response => {
				res.json({ status: 'command received' });
			})
			.catch(error => {
				res.json({ status: 'error', error: error.message });
			});
	} else {
		res.json({ status: 'unknown command' });
	}
});

// Endpoint para que el plugin Brave reciba los comandos
app.get('/command', (req, res) => {
	if (commands.length > 0) {
		const command = commands.shift();
		console.log('Command sent: ' + command);
		res.json(command);
	} else {
		let command = COMMANDS.EMPTY_COMMAND;
		res.json(command);
	}
});

app.post('/command', (req, res) => {
	commandData = req.body;
	console.log('Command received: ' + commandData.command);
	commands.push(commandData);
	res.json({ status: 'command received' });
});

app.listen(listenPort, () => {
	console.log(`Server listening on port ${listenPort}`);
});

// //waits for the user to input a command
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (text) => {
	console.log('Command received: ' + text);
	commands.push(text);
}); 3

module.exports = {
	pushCommand: (command) => {
		commands.push(command);
	}
}


// {"command": "navigate", "url": "https://google.com"}
// {"command": "modifyDOM", "script": "alert('Hello from Hubeet!');"}
// {"command": "executeOnActiveTab", "script": "type 'hola' in textarea"}
// {"command": "executeOnActiveTab", "script": "clickButton 'Buscar con Google'"}
// {"command": "executeOnActiveTab", "script": "clickButton 'Mensajes'"}
// {"command": "executeOnActiveTab", "script": "goBack"}
// {"command": "executeOnActiveTab", "script": "goForward"}

