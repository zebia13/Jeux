// function tongue.says(message,command,file,situation,option)
const tongue = require ('../modules/tongue.js');
let helpCategories;
let privilegeCategories;

const chapterTitle = 'help';

module.exports = {
	name: 'help',
	description: tongue.says('', chapterTitle, 'description'),
	aliases: ['commands'],
	usage: tongue.says('', chapterTitle, 'usage'),
	cooldown: 5,
	help: true,
	core: true,
	privacy: 'public',

	// initialisation of the command with the referenced categories for privilege and comand categories
	initialize(items) {
		helpCategories = items.arrays.helpCategory;
		privilegeCategories = items.arrays.privilegeCategory;
		return 'help categories loaded';
	},

	execute(message, args) {
		// creation of the commands object from command client
		const { commands } = message.client;

		// global help if no specified command
		if (!args.length) {
			// create the list of all command with help property
			const helpcommands = commands.filter(com => com.help);
			// create the list of core commands
			const corecommands = helpcommands.filter(com => com.core);
			// create the text part for core commands
			const coreList = [];
			corecommands.forEach(command => {
				const custom = {
					commandName : command.name,
					commandDescription : command.description,
				};
				coreList.push(tongue.says(message, chapterTitle, 'list', custom));
			});
			// showHelpCommands is the final object to show the help
			const showHelpCommands = {
				core : coreList,
			};
			// create a property for each registered command category
			helpCategories.forEach(category => {
				showHelpCommands[category] = [];
			});

			// categoryCommands is the object that will contain all the commands by category and privilegeCommands all the registered privileges
			const categoryCommands = {};
			const privilegeCommands = {};

			// for each privilege category
			privilegeCategories.forEach(actualprivilege => {
				// get all the commands with that level of privilege
				privilegeCommands[actualprivilege] = helpcommands.filter(com => com.privacy === actualprivilege);
				// if the user has that level of privilege
				if (message.author.privilege[actualprivilege]) {
					helpCategories.forEach(category => {
						// fill the commands to show with the commands of that level of privilege
						categoryCommands[category] = privilegeCommands[actualprivilege].filter(com => com[category]);
						showHelpCommands[category].push(tongue.says(message, chapterTitle, actualprivilege));
						categoryCommands[category].forEach(command => {
							const custom = {
								commandName : command.name,
								commandDescription : command.description,
							};
							showHelpCommands[category].push(tongue.says(message, chapterTitle, 'list', custom));
						});
					});
				}
				// if the player has not the privilege but the guild has
				else if (message.guild) {
					if (message.guild.privilege[actualprivilege]) {
						helpCategories.forEach(category => {
							// fill the commands to show with the commands of that level of privilege
							categoryCommands[category] = privilegeCommands[actualprivilege].filter(com => com[category]);
							showHelpCommands[category].push(tongue.says(message, chapterTitle, `${actualprivilege}guild`));
							categoryCommands[category].forEach(command => {
								const custom = {
									commandName : command.name,
									commandDescription : command.description,
								};
								showHelpCommands[category].push(tongue.says(message, chapterTitle, 'list', custom));
							});
						});
					}
				}
			});

			// format the text to show
			for (const list in showHelpCommands) {
				showHelpCommands[list] = showHelpCommands[list].join('');
			}
			const custom = showHelpCommands;

			// send the message by DM
			return tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'listall', custom), true)
				.then(() => {
					// if the help request was made in guild channel, inform the player that help was given by DM
					if (message.channel.type === 'DM') return;
					message.channel.send(tongue.says(message, chapterTitle, 'dm'));
				})
				// if an error occur sending the DM
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					// tell the player an error occur and send the help in the guild channel
					if (message.channel.type !== 'DM') {
						message.channel.send(tongue.says(message, chapterTitle, 'problemdm'));
						tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'listall', custom));
					}
				});
		}

		// if help is requested on a specific command
		const name = args[0].toLowerCase();
		// use the user input to get the correct command name
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		// if the input is not a command tell the user an error occur
		if (!command) {
			return message.channel.send(tongue.says(message, chapterTitle, 'problemcommand'));
		}

		// if the command has an help property
		if (command.help) {
			// create the help data for the user
			const custom = {
				commandName : command.name,
				commandCooldown : command.cooldown,
			};
			if (command.aliases) custom.alias = command.aliases.join(', ');
			if (command.description) custom.description = command.description;
			if (command.usage) custom.usage = command.usage;

			// send the message by DM
			return tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'listall', custom), true)
				.then(() => {
					// if the help request was made in guild channel, inform the player that help was given by DM
					if (message.channel.type === 'DM') return;
					message.channel.send(tongue.says(message, chapterTitle, 'dmcommand', custom));
				})
				// if an error occur sending the DM
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					// tell the player an error occur and send the help in the guild channel
					if (message.channel.type !== 'DM') {
						message.channel.send(tongue.says(message, chapterTitle, 'problemdm'));
						tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'listall', custom));
					}
				});
		}
		// there is no help for this command
		else {
			return message.channel.send(tongue.says(message, chapterTitle, 'nohelp'));
		}
	},
};
