// function tongue.says(message,command,file,situation,option)
const tongue = require ('../modules/tongue.js');
const fs = require('fs');

const adminTitle = 'adm';

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	idpermission: 'owner',
	aliases: ['rl'],
	usage: '[the command you want to reload]',
	help:false,

	async execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, adminTitle, 'reloadnocommand'));

		// load the command name
		const commandName = args[0].toLowerCase();
		const custom = { commandName : commandName };
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		// if the command name is tongue, reload the bot replies
		if (commandName === 'tongue' || commandName === 'replies') {
			await tongue.initialize('tongue');
			message.channel.send(tongue.says(message, adminTitle, 'reloadtongue'));
		}
		// if the command is bot, reload the bot items
		else if (commandName === 'bot' || commandName === 'client') {
			// reload the bot items from initialize function
			message.client.items = message.client.initialize(message.client.items);
			message.channel.send(tongue.says(message, adminTitle, 'reloadbot'));
		}
		// if the command is not a command report an error
		else if (!command) {
			return message.channel.send(tongue.says(message, adminTitle, 'reloadwrongcommand', custom));
		}
		else {
			// if the command is a command
			let sharedCommand = true;
			// load the botPath for loading command
			const botPath = require.cache[require.resolve(Object.keys(require.cache)[0])].path;
			let path = `${botPath}/commands`;
			const commandFiles = fs.readdirSync(path).filter(file => file.endsWith('.js'));
			if (!commandFiles.includes(`${command.name}.js`)) {
				const folders = fs.readdirSync(path, { withFileTypes: true }).filter(file => file.isDirectory());
				if (folders) {
					// for each folder, extract the commands
					for (const folder of folders) {
						const folderCommandFiles = fs.readdirSync(`${path}/${folder.name}`).filter(file => file.endsWith('.js'));
						if (folderCommandFiles.includes(`${command.name}.js`)) {
							path = `${path}/${folder.name}`;
						}
					}
				}
			}

			// try to delete the path as if it were a regular command
			try {
				delete require.cache[require.resolve(`./${command.name}.js`)];
			}
			// if an error occur delete the path as a shared command
			catch (e) {
				delete require.cache[require.resolve(`${path}/${command.name}.js`)];
				// recognize the reloaded command as a shared command
				sharedCommand = false;
			}
			try {
				// try to reload the new command wether it's a shared command or not
				let newCommand;
				if (sharedCommand) {
					// reload the new command
					newCommand = require(`./${command.name}.js`);
					// initialize the command
					if (newCommand.initialize !== undefined) {
						await newCommand.initialize(message.client.items);
					}
				}
				else {
					// reload the new command
					newCommand = require(`${path}/${command.name}.js`);
					// initialize the command
					if (newCommand.initialize !== undefined) {
						await newCommand.initialize(message.client.items);
					}
				}
				message.client.commands.set(newCommand.name, newCommand);
			}
			// if an error occur in reloading the new command share the error
			catch (error) {
				console.error(error);
				custom.errorMessage = error;
				message.channel.send(tongue.says(message, adminTitle, 'errorreload', custom));
			}
			// tell the user the command is reloaded
			message.channel.send(tongue.says(message, adminTitle, 'reload', custom));
		}
	},
};
