class TaskManager {
	constructor() {
		this.tasks = [];
	}

	addTask(task) {
		console.log(`Task added: ${task}`);
		this.tasks.push(task);
	}

	executeTasks() {
		this.tasks.forEach(task => task());
	}

	clearTasks() {
		this.tasks = [];
	}
}

module.exports = TaskManager;
