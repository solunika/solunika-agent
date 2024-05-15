const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');

async function getClassAsDescription(path) {
	const code = fs.readFileSync(path, 'utf8');
	const ast = parser.parse(code, {
		sourceType: 'module',
		plugins: [
			'classProperties',
			'decorators-legacy',
			'typescript',
		],
	});

	let className = '';
	let constructorContent = '';
	let methodsSummary = [];

	traverse(ast, {
		ClassDeclaration(path) {
			className = path.node.id.name;
		},
		ClassMethod(path) {
			const methodName = path.node.key.name;

			if (methodName === 'constructor') {
				// Extraer el contenido completo del constructor
				const start = path.node.body.start;
				const end = path.node.body.end;
				constructorContent = code.substring(start + 1, end - 1).trim(); // Se extrae el cuerpo sin las llaves
			} else {
				const params = path.node.params.map(param => param.name).join(', ');
				methodsSummary.push(`${methodName}(${params})`);
			}
		}
	});

	if (!className) return 'Class name not found.';

	let resume = `Class: ${className}\n`;
	if (constructorContent) resume += `Constructor:\n${constructorContent}\n`;
	if (methodsSummary.length) resume += `Methods:\n${methodsSummary.join('\n')}`;
	return resume;
}
//This function gets a javascript file path and returns a "resume" of the classes in CORE_CLASSES as a string
//The resume should be a string with the following format:
//Class: <class name>
//Methods:
//<method name>(<method parameters>)
//<method name>(<method parameters>)
//...
//Class: <class name>
//Methods:
//<method name>(<method parameters>)
//And so on
const CORE_CLASSES = ['LongTermMemory.js', 'ShortTermMemory.js', 'Reality.js', 'Dream.js', 'OutputChannel.js', 'TaskManager.js'];
async function getClassesInterfacesAsDescription(BASE_PATH) {
	let resume = '';

	for (let className of CORE_CLASSES) {
		const filePath = `${BASE_PATH}/lib/core/${className}`;
		const code = fs.readFileSync(filePath, 'utf8');
		const ast = parser.parse(code, {
			sourceType: 'module',
			plugins: [
				'classProperties',
				'decorators-legacy',
				'typescript',
			],
		});

		let foundClassName = '';
		let constructorContent = '';
		let methodsSummary = [];

		traverse(ast, {
			ClassDeclaration(path) {
				foundClassName = path.node.id.name;
			},
			ClassMethod(path) {
				const methodName = path.node.key.name;

				if (methodName === 'constructor') {
					const start = path.node.body.start;
					const end = path.node.body.end;
					constructorContent = code.substring(start + 1, end - 1).trim();
				} else {
					const params = path.node.params.map(param => param.name).join(', ');
					methodsSummary.push(`${methodName}(${params})`);
				}
			}
		});

		resume += `Class: ${foundClassName}\n`;
		if (constructorContent) resume += `Constructor:\n${constructorContent}\n`;
		if (methodsSummary.length) resume += `Methods:\n${methodsSummary.join('\n')}\n`;
	}

	return resume;
}

async function fillTemplate(template, data) {
	for (let key in data) {
		template = template.replace(`{{${key}}}`, data[key]);
	}
	return template;
}

module.exports = {
	getClassAsDescription,
	getClassesInterfacesAsDescription,
	fillTemplate
}