// require the discord.js module and the config.json datas
require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const _ = require('lodash');
const gsheetkeys = require('./configGsheet.json');
const premium = require('./modules/premium.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//													collectDatas that gives you specified datas from a spreadhseet
//													updateSheet that allows you to update a spreadsheet
//													updateValues that allows you to update values in a spreadsheet
//													appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../modules/api-gsheet.js');
// link the app with the google API
async function googleAPILoad() {
	const load = await gsheetlink.link(gsheetkeys);
	return load;
}
// reference to find sheet in the config file
let sheetTitle = {};
// reference of the admin shared command
const adminCommandName = 'admin';
// chapter titles to find text in tongue module
const adminTitle = 'adm';
const chapterTitle = 'main';
// Premium constant allows or denies the use of premium privileges for players or gang
const guildPremium = true;
const playerPremium = true;

// initialisation of the bot
async function initialize(items) {
	const load = await googleAPILoad();
	console.log(load);
	// load the global datas
	const botDataRequest = {
		spreadsheetId : process.env.config_spreadsheet,
		range : 'index!A2:B',
	};
	let botData = await gsheetlink.collectDatas(botDataRequest);
	// extract the title of the gang and players sheet from the premium spreadsheet
	const name = botData.map(row => row[0]);
	const title = botData.map(row => row[1]);
	sheetTitle = {
		config : title[name.indexOf('config')],
		datas : title[name.indexOf('datas')],
		guild : title[name.indexOf('guild')],
		user : title[name.indexOf('user')],
	};
	// store the bot data in the data object
	let dataFinal = {};
	// check the config data in each sheet
	for (const sheetName in sheetTitle) {
		botDataRequest.range = `${sheetTitle[sheetName]}!B2:E`;
		botData = await gsheetlink.collectDatas(botDataRequest);
		botData.forEach((line, i) =>{
			const dataConstruct = {};
			let nestedData = dataConstruct;
			line.forEach((cell, j) => {
				if (cell === '') botData[i][j] = botData[i - 1][j];
			});
			let j = 0;
			// translate the data in JSON
			const dataParse = JSON.parse(line[line.length - 1]);
			while (j < line.length - 1) {
				nestedData[line[j]] = {};
				if (j === line.length - 2) nestedData[line[j]] = dataParse;
				nestedData = nestedData[line[j]];
				j++;
			}
			// merge all objects founded
			dataFinal = _.merge(dataConstruct, dataFinal);
		});
	}
	// store all the data in the items object
	items = dataFinal;

	// store all the specific items for each player
	const userItems = [];
	for (const item in items[sheetTitle['user']]) {
		userItems.push(item);
	}
	items.userItems = userItems;

	// oject to be exported in different module and commands
	items['private'] = {
		gsheetkeys : gsheetkeys,
		paypalId : process.env.paypalId,
		paypalSecret : process.env.paypalSecret,
	};

	// launch the initialize process for shared modules
	await loadModule('../modules');
	await loadModule('./modules');

	// function to load all modules in the good folderpath
	async function loadModule(path) {
		const ModuleFiles = fs.readdirSync(path).filter(file => file.endsWith('.js'));
		for (const file of ModuleFiles) {
			const mod = await require(`${path}/${file}`);
			// set a new item in the Collection
			// with the key as the command name and the value as the exported module
			if (mod.initialize !== undefined) {
				const moduleload = await mod.initialize(items);
				console.log(`${file} : ${moduleload}`);
			}
		}
	}

	return items;
}

// create the specific properties for guild
function setGuild(guild, items) {
	for (const item in items[sheetTitle['guild']]) {
		if (typeof items[sheetTitle['guild']][item] === 'object') {
			guild[item] = Object.assign({}, items[sheetTitle['guild']][item]);
		}
		else {
			guild[item] = items[sheetTitle['guild']][item];
		}
	}
}

// create the specific properties for user
function setUser(user, items) {
	for (const item in items[sheetTitle['user']]) {
		if (typeof items[sheetTitle['user']][item] === 'object') {
			user[item] = Object.assign({}, items[sheetTitle['user']][item]);
		}
		else {
			user[item] = items[sheetTitle['user']][item];
		}
	}
}

initialize().then(items => {

	// create a new Discord client and add the commands files
	const intents = [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
		Discord.Intents.FLAGS.GUILD_WEBHOOKS,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	];
	const partials = [
		'MESSAGE',
		'CHANNEL',
		'REACTION',
		'GUILD_MEMBER',
	];
	const client = new Discord.Client({ intents : intents, partials : partials });
	client.state = {
		basic : true,
		debug : true,
		ready : false,
	};
	client.items = items;
	client.initialize = initialize;

	const tongue = require('../modules/tongue.js');

	client.commands = new Discord.Collection();

	async function loadCommands() {

		// load bot commands
		await getFolders('../commands');
		await getFolders('./commands');
		// function to extract the folders
		async function getFolders(path) {
			await setCommand(path);
			const folders = fs.readdirSync(path, { withFileTypes: true }).filter(file => file.isDirectory());
			if (folders) {
				// for each folder, extract the commands
				for (const folder of folders) {
					path = `${path}/${folder.name}`;
					await setCommand(path);
				}
			}
		}

		// function to set all commands in a defined folder
		async function setCommand(comPath) {
			const commandFiles = fs.readdirSync(comPath).filter(file => file.endsWith('.js'));
			if (commandFiles) {
				for (const file of commandFiles) {
					const command = require(`${comPath}/${file}`);
					// set a new item in the Collection
					// with the key as the command name and the value as the exported module
					if (command.initialize !== undefined) {
						const commandload = await command.initialize(items);
						console.log(`${file} : ${commandload}`);
					}
					const custom = { name : command.name };
					if (client.commands.has(command)) console.log(tongue.says('', adminTitle, 'errorloadingcommand', custom));
					client.commands.set(command.name, command);
				}
			}
		}
	}

	loadCommands().then(() => {

		// create a cooldown to avoid spam from users
		const cooldowns = new Discord.Collection();
		// register the admin command to get its properties
		const adminCommand = client.commands.get(adminCommandName);

		// when the client is ready, run this code
		// this event will only trigger one time after logging in
		client.once('ready', () => {

			// load the messages of updates from the host guild
			async function hostUpdate() {
				const channel = client.channels.cache.get(items.ids.hostUpdateChannel);
				const messageFetched = await channel.messages.fetch();
				const messageArray = [[], []];
				messageFetched.forEach((value, key) => {
					messageArray[0].push(key);
					messageArray[1].push(value);
				});
				messageArray[0].reverse();
				messageArray[1].reverse();
				client.items.ids.hostUpdateMessages = new Map();
				messageArray[0].forEach((key, i) => {
					client.items.ids.hostUpdateMessages.set(key, messageArray[1][i]);
				});
				// load the message in the admin command
				adminCommand.hostUpdate.messages = client.items.ids.hostUpdateMessages;
				console.log('host messages fetched');
			}

			// function to set the privileges of guilds and players
			async function getPrivilege() {

				// load the ace guild
				const aceguild = client.guilds.cache.get(items.ids.aceserverID);
				// if no privilege, load the guild privileges
				if (!aceguild.privilege) {
					setGuild(aceguild, client.items);
				}
				aceguild.privilege.ace = true;
				console.log('Ace has privilege!');

				// load all the guilds where the client is
				client.guilds.cache.each(guild => {
					// for each guild, set the privileges of the guild
					if (!guild.privilege) {
						setGuild(guild, client.items);
					}
					console.log(guild.id);
					console.log(guild.name);
					console.log(premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1]);
					// set the premium privilege if the guild is in the premium list
					if (premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].includes((guild.id))) {
						guild.privilege.premium = guildPremium;
						guild.language = premium.PremiumGuildsID[premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].indexOf(guild.id)][4];
						if (premium.PremiumGuildsID[premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].indexOf(guild.id)][5]) guild.update.channel = premium.PremiumGuildsID[premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].indexOf(guild.id)][5];
						if (premium.PremiumGuildsID[premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].indexOf(guild.id)][6]) guild.update.messages = premium.PremiumGuildsID[premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1].indexOf(guild.id)][6].split(',');
					}
				});
				// load all the premiums id in the client.items
				client.items.ids.premiumGuilds = premium.PremiumGuildsID[premium.PremiumGuildsID.length - 1];

				console.log('Premium guilds have privilege!');

				// give all ace players ace privilege
				for (const role of items.arrays.roletrackarray) {
					const aceMembersID = await premium.getRoleIds(aceguild, role[1]);
					for (let aceUser of aceMembersID) {
						aceUser = await client.users.fetch(aceUser);
						if (!aceUser.privilege) {
							setUser(aceUser, client.items);
						}
						aceUser.privilege.ace = true;
					}
				}
				console.log('Ace players have privilege!');

				// set the attributes of all mafia players registered
				for (let mafiaUser of premium.playersMafiaID) {
					mafiaUser = await client.users.fetch(mafiaUser);
					if (!mafiaUser.attributes) {
						setUser(mafiaUser, client.items);
					}
				}
				console.log('Game players have attributes!');

				// give the privilege premium to all players registered as premium
				for (const premiumUserID of premium.PremiumPlayersID[premium.PremiumPlayersID.length - 1]) {

					const premiumUser = await client.users.fetch(premiumUserID);
					if (!premiumUser.privilege) {
						setUser(premiumUser, client.items);
					}
					premiumUser.privilege.premium = playerPremium;
					premiumUser.language = premium.PremiumPlayersID[premium.PremiumPlayersID[premium.PremiumPlayersID.length - 1].indexOf(premiumUserID)][2];
				}
				console.log('Premium players have privilege!');

				console.log('Idle Mafia Bot is Ready!');
			}

			// load all require data before launching the bot
			async function launch() {
				// load the messages from the host guild
				await hostUpdate();
				// set guilds and user privileges
				await getPrivilege();
				// start the game datas
				const start = client.commands.get('start');
				await start.start(client);
			}

			launch().then(()=>{
				client.state.ready = true;
				// function tongue.says(message,command,file,situation,option)
				console.log(tongue.says('', adminTitle, 'ready'));
			});
		});

		// this event will be active and waiting for messages
		client.on('messageCreate', async message => {

			if (message.channel.partial) await message.channel.fetch();

			// check if the bot is Ready
			if (!client.state.ready) return;

			// add new parameters if not already present
			if (message.guild) {
				if (!message.guild.privilege) {
					setGuild(message.guild, client.items);
				}
			}
			if (!message.author.privilege) {
				setUser(message.author, client.items);
			}

			// this command is specific to official discord for collecting suggestions
			// add reaction collector
			if (message.guild) {
				if (message.guild.id === '562104606474371074' && message.channel.id === '563210191152349184' && message.author.bot) {
					const receiveEmbed = message.embeds[0];
					if (receiveEmbed !== undefined) {
						const suggestionvalues = [new Date(), receiveEmbed.author.name, receiveEmbed.description];
						const suggestionrequest = {
							spreadsheetId : `${items.spreadsheets.suggestionspreadsheet}`,
							valueInputOption : 'RAW',
							insertDataOption : 'INSERT_ROWS',
							range : 'suggestions!A2:I',
						};
						suggestionrequest.resource = {
							range: 'suggestions!A2:I',
							values: [suggestionvalues],
						};
						gsheetlink.appendValues(suggestionrequest).then(appendResponse => {
							const row = appendResponse.updates.updatedRange.slice(appendResponse.updates.updatedRange.indexOf('A') + 1, appendResponse.updates.updatedRange.indexOf(':'));
							let agree = 0;
							let disagree = 0;
							const suggestionReactRequest = {
								spreadsheetId : `${items.spreadsheets.suggestionspreadsheet}`,
								resource : {
									valueInputOption: 'RAW',
									data: [{
										range: `suggestions!D${row}:E${row}`,
										values: [[agree, disagree]],
									}],
								},
							};
							const filter = (reaction) => {
								return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
							};
							const reactcollector = message.createReactionCollector(filter, { time: 1036800000, dispose: true });
							reactcollector.on('collect', (reaction) => {
								if (reaction.emoji.name === '✅') agree += 1;
								if (reaction.emoji.name === '❌') disagree += 1;
								suggestionReactRequest.resource.data[0].values = [[agree, disagree]];
								gsheetlink.updateValues(suggestionReactRequest);
							});
							reactcollector.on('remove', (reaction) => {
								if (reaction.emoji.name === '✅') agree -= 1;
								if (reaction.emoji.name === '❌') disagree -= 1;
								suggestionReactRequest.resource.data[0].values = [[agree, disagree]];
								gsheetlink.updateValues(suggestionReactRequest);
							});
							delete suggestionrequest.resource;
						});
					}
				}
			}

			// check if the message is an update from the host guild
			if (message.channel.id === items.ids.hostUpdateChannel && !message.author.bot) {
				// store the message in the admin command and send it in premium guilds
				adminCommand.hostUpdate.messages.set(message.id, message);
				adminCommand.batchUpdate('new', client.items.ids.premiumGuilds, message);
			}

			// check if the message has not the prefix or is written by a bot and quit if so
			if (!message.content.toLowerCase().startsWith(items.prefix) || message.author.bot) return;

			// if the bot is in debug mode
			if (client.state.debug) {
				// load the name of the guild where the message has been send
				let guild = 'no guild';
				if (message.guild) guild = message.guild.name;
				// create the debug values and request
				const debugvalues = [new Date(), message.author.tag, message.channel.type, guild, message.content];
				const debugrequest = {
					spreadsheetId : `${items.spreadsheets.supportspreadsheet}`,
					valueInputOption : 'RAW',
					insertDataOption : 'INSERT_ROWS',
					range : 'debug!A2:I',
				};
				debugrequest.resource = {
					range: 'debug!A2:I',
					values: [debugvalues],
				};
				// write the message in the debug spreadsheet
				await gsheetlink.appendValues(debugrequest);
				delete debugrequest.resource;
			}

			// Create the args array deleting the prefix and stocking each word
			// args contain all the message
			const args = message.content.slice(items.prefix.length).trim().split(/ +/);
			const commandName = args.shift().toLowerCase();

			// switch debug mode
			if (commandName === 'debug' && message.author.id === items.ids.discordownerid) {
				client.state.debug = !client.state.debug;
				if (client.state.debug) return message.channel.send(tongue.says(message, adminTitle, 'debugon'));
				if (!client.state.debug) return message.channel.send(tongue.says(message, adminTitle, 'debugoff'));
			}

			// switch from regular bass to advanced bass on ace channel
			if (commandName === 'switch' && message.author.id === items.ids.discordownerid) {
				client.state.basic = !client.state.basic;
				if (!client.state.basic && client.user.id === items.ids.advancedBassID) return message.channel.send(tongue.says(message, adminTitle, 'off'));
				if (client.state.basic && client.user.id !== items.ids.advancedBassID) return message.channel.send(tongue.says(message, adminTitle, 'on'));
				return;
			}

			// filter between Bass and advanced Bass
			if (message.channel.type !== 'DM') {
				if (message.guild.privilege.ace) {
					if (client.state.basic && client.user.id === items.ids.advancedBassID) return;
					if (!client.state.basic && client.user.id !== items.ids.advancedBassID) return;
				}
			}

			// check if the first word after the prefix is a command and quit if not
			const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

			function errorMessage(chapter, commandReference, custom) {
				try {
					message.channel.send(tongue.says(message, chapter, commandReference, custom));
				}
				catch(e) {
					console.log(e);
				}
			}

			if (!command) {
				return errorMessage(chapterTitle, 'nocommand');
			}

			// check if the command is for server or direct message
			if (command.guildOnly && message.channel.type === 'DM') {
				return errorMessage(chapterTitle, 'nodm');
			}

			// check if the author has a permission to launch the command
			if (command.permissions) {
				const authorPerms = message.channel.permissionsFor(message.author);
				if (!authorPerms || !authorPerms.has(command.permissions)) {
					if (message.author.id !== items.ids.discordownerid) {
						return errorMessage(chapterTitle, 'nopermission');
					}
				}
			}

			if (command.idpermission) {
				const idperm = command.idpermission;
				if (idperm === 'owner' && message.author.id !== items.ids.discordownerid) {
					return errorMessage(chapterTitle, 'nopermission');
				}
			}

			// check if command is restricted to Premium Server or Ace players
			if (command.privacy === 'premium') {
				if (message.channel.type === 'DM' && !(message.author.privilege.premium || message.author.privilege.ace)) return errorMessage(chapterTitle, 'premiumserverrestricted');
				if (message.channel.type !== 'DM' && !(message.guild.privilege.ace || message.guild.privilege.premium || message.author.privilege.premium || message.author.privilege.ace)) return errorMessage(chapterTitle, 'premiumserverrestricted');
			}

			// check if command is restricted to Ace players
			if (command.privacy === 'ace') {
				if (message.channel.type === 'DM' && !message.author.privilege.ace) return errorMessage(chapterTitle, 'acerestricted');
				if (message.channel.type !== 'DM' && !(message.guild.privilege.ace || message.author.privilege.ace)) return errorMessage(chapterTitle, 'acerestricted');
			}

			// check if the player has been banned from bot user
			if (message.author.ban) {
				return errorMessage(chapterTitle, 'banned');
			}

			// check if there is something after the prefix and if it is used in a proper way
			if (command.args && !args.length) {
				let reply = tongue.says(message, chapterTitle, 'noargument');
				if (command.usage) {
					const custom = {
						commandUsage: command.usage,
						commandName: commandName,
					};
					reply += tongue.says(message, chapterTitle, 'properway', custom);
				}
				try {
					return message.channel.send(reply);
				}
				catch(e) {
					console.log(e);
				}
			}

			// check and set the cooldowns for commands
			if (!cooldowns.has(command.name)) {
				cooldowns.set(command.name, new Discord.Collection());
			}

			// set the cooldown time depending on the privilege
			const now = Date.now();
			const timestamps = cooldowns.get(command.name);
			let cooldownAmount = (command.cooldown || 3) * 1000;
			if (message.author.privilege.premium && command.premiumCooldown) cooldownAmount = command.premiumCooldown * 1000;

			// check if the player is already referenced in the timestamp of the command
			if (timestamps.has(message.author.id)) {
				const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

				// check if the timestamp has expired
				if (now < expirationTime) {
					// set the time left in seconds
					let timeLeft = Math.trunc((expirationTime - now) / 1000 + 1);
					let timeDisplayed = '';
					const custom = {};
					// if the time left is more than one day
					if (timeLeft > 86400) {
						const days = Math.trunc(timeLeft / 86400);
						timeLeft = timeLeft - days * 86400;
						timeDisplayed = `${days} ${tongue.says('', 'location', 'days')}`;
					}
					// if the time left is more than one hour
					if (timeLeft > 3600) {
						const hours = Math.trunc(timeLeft / 3600);
						timeLeft = timeLeft - hours * 3600;
						timeDisplayed = `${timeDisplayed} ${hours} ${tongue.says('', 'location', 'hours')},`;
					}
					// if the time left is more than one minute
					if (timeLeft > 60) {
						const minutes = Math.trunc(timeLeft / 60);
						timeLeft = timeLeft - minutes * 60;
						timeDisplayed = `${timeDisplayed} ${minutes} ${tongue.says('', 'location', 'minutes')},`;
					}
					if (timeLeft > 0) {
						timeDisplayed = `${timeDisplayed} ${timeLeft} ${tongue.says('', 'location', 'seconds')}`;
					}
					custom.time = timeDisplayed;
					custom.commandName = commandName;
					errorMessage(chapterTitle, 'waitcooldown', custom);
					if (command.premiumCooldown && !message.author.privilege.premium) {
						custom.premiumTime = command.premiumCooldown;
						errorMessage(chapterTitle, 'premiumcooldown', custom);
					}
					return;
				}
			}

			// set a new timestamp
			timestamps.set(message.author.id, now);
			setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

			// Launch the command from the folder commands

			try {
				command.execute(message, args, client);
			}
			catch (error) {
				console.error(error);
				const custom = { command : command.name };
				return errorMessage(adminTitle, 'commandreportproblem', custom);
			}
		});

		// this event will be active and waiting for messages
		client.on('messageUpdate', async (oldMessage, newMessage) => {
			// check if the message is an update
			if (oldMessage.channel.id === items.ids.hostUpdateChannel && !newMessage.author.bot) {
				console.log('edit');
				// store the message in the admin command
				adminCommand.hostUpdate.messages.set(newMessage.id, newMessage);
				adminCommand.batchUpdate('edit', client.items.ids.premiumGuilds, newMessage);
			}
		});

		// this event will be active and waiting for messages
		client.on('messageDelete', async message => {
			// check if the message is an update
			if (message.channel.id === items.ids.hostUpdateChannel && !message.author.bot) {
				console.log('delete');
				adminCommand.batchUpdate('delete', client.items.ids.premiumGuilds, message);
			}
		});

		client.on('guildMemberUpdate', (oldMember, newMember) => {
			console.log('guildmemberupdate');
			console.log(oldMember.guild);
			const roles = items.arrays.roletrackarray.map(row => row[1]);
			let oldHasRole = false;
			let newHasRole = false;
			for (const role of roles) {
				if (oldMember.roles.cache.has(role)) oldHasRole = true;
				if (newMember.roles.cache.has(role)) newHasRole = true;
			}
			if (newHasRole && !oldHasRole) {
				if (!newMember.privilege) {
					setUser(newMember, client.items);
				}
				newMember.privilege.ace = true;
			}
			else if (!newHasRole && oldHasRole) {
				if (!newMember.privilege) {
					setUser(newMember, client.items);
				}
				newMember.privilege.ace = false;
			}
		});

		client.on('guildMemberRemove', member => {
			console.log('guildmemberremove');
			console.log(member.guild);
			if (member.guild.id === items.ids.aceserverID) {
				if (member.privilege) {
					member.privilege.ace = false;
				}
			}
		});


		// login to Discord with your app's token
		client.login(process.env.discordtoken);
	});
});
