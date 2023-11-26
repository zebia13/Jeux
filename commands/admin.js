// function tongue.says(message,command,file,situation,option)
const tongue = require ('../modules/tongue.js');
const tell = require ('../modules/tell.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('../modules/api-gsheet.js');
let premiumspreadsheet;
let gangSheetTitle;
let playerSheetTitle;
let languageSheetTitle;
const langNamesBasic = [[], []];
let ownerID;
const hostUpdate = {};
let premiumGuildIds;

const chapterTitle = 'admin';

module.exports = {
	name : 'admin',
	description : tongue.says('', chapterTitle, 'description'),
	permissions : 'MANAGE_GUILD',
	aliases : ['set'],
	usage : tongue.says('', chapterTitle, 'usage'),
	help : true,
	core : true,
	privacy :'premium',
	guildOnly : true,
	hostUpdate : hostUpdate,

	// initialize function to set ownerId, the bot premium spreadsheet and premium user for this bot
	async initialize(items) {
		ownerID = items.ids.discordOwnerID,
		// get the premium spreadsheet
		premiumspreadsheet = items.spreadsheets.premiumspreadsheet;
		const baseRequest = {
			spreadsheetId : premiumspreadsheet,
			range : 'index!A2:C',
		};
		const baseData = await gsheetlink.collectDatas(baseRequest);
		// extract the title of the gang and players sheet from the premium spreadsheet
		const name = baseData.map(row => row[0]);
		const title = baseData.map(row => row[1]);
		gangSheetTitle = title[name.indexOf('guilds')];
		playerSheetTitle = title[name.indexOf('users')];
		// get the index of the language sheet of the bot
		const languageSheetID = items.spreadsheets.languagespreadsheet;
		const languageRequest = {
			spreadsheetId : languageSheetID,
			range : 'index!A2:C',
		};
		const langSheet = await gsheetlink.collectDatas(languageRequest);
		// get the name of the languages sheet from the language spreadsheet
		const lName = langSheet.map(row => row[0]);
		const lTitle = langSheet.map(row => row[1]);
		languageSheetTitle = lTitle[lName.indexOf('languages')];
		// get the available languages for the bot
		languageRequest.range = `${languageSheetTitle}!A2:D`;
		const availableLang = await gsheetlink.collectDatas(languageRequest);
		// create an array with name and summary of possible languages
		availableLang.forEach(line => {
			if (line[3] === '1') {
				langNamesBasic[0].push(line[0]);
			}
		});
		// collect the data for the premium guilds and users
		const baseGuildRequest = {
			spreadsheetId : premiumspreadsheet,
			range : `${gangSheetTitle}!A2:G`,
		};
		const guildDatas = await gsheetlink.collectDatas(baseGuildRequest);
		// create the arrays with ID of premium guilds and users
		premiumGuildIds = guildDatas.map(row => row[0]);
		if (items.ids.hostUpdateMessages !== 'null') {
			this.hostUpdate.messages = items.ids.hostUpdateMessages;
		}

		return 'gang spreadsheet ID and title loaded';
	},

	async execute(message, args) {

		const langNames = langNamesBasic;

		// collect the data for the premium guilds and users
		const baseGuildRequest = {
			spreadsheetId : premiumspreadsheet,
			range : `${gangSheetTitle}!A2:G`,
		};
		const baseUserRequest = {
			spreadsheetId : premiumspreadsheet,
			range : `${playerSheetTitle}!A2:G`,
		};
		const guildDatas = await gsheetlink.collectDatas(baseGuildRequest);
		const userDatas = await gsheetlink.collectDatas(baseUserRequest);

		// create the arrays with ID of premium guilds and users
		premiumGuildIds = guildDatas.map(row => row[0]);
		const premiumUserIds = userDatas.map(row => row[0]);

		// check if the user is in the premium user list
		if (!premiumUserIds.includes(message.author.id)) {
			message.channel.send(tongue.says(message, chapterTitle, 'notpremium'));
		}

		// check if there is a command after admin
		if (!args.length) {
			// register the guild if not yet registered in the premium guilds
			if (!premiumGuildIds.includes(message.guild.id)) {
				let guildowner = await message.guild.members.fetch(message.guild.ownerId);
				guildowner = guildowner.user;
				const newGangData = [message.guild.id, message.guild.name, guildowner.id, `${guildowner.username}#${guildowner.discriminator}`, 'en', message.channel.id];
				const addRequest = {
					spreadsheetId : premiumspreadsheet,
					valueInputOption : 'RAW',
					insertDataOption : 'INSERT_ROWS',
					range : `${gangSheetTitle}!A2:G`,
					resource : {
						range: `${gangSheetTitle}!A2:G`,
						values: [newGangData],
					},
				};

				await gsheetlink.appendValues(addRequest);
				return message.channel.send(tongue.says(message, chapterTitle, 'gangregistered'));
			}
			else {
				return message.channel.send(tongue.says(message, chapterTitle, 'adminnocommand'));
			}
		}

		// search the gangLine and playerLine where to change datas
		const gangLine = premiumGuildIds.indexOf(message.guild.id);
		const playerLine = premiumUserIds.indexOf(message.author.id);

		const updateRequest = {
			spreadsheetId : premiumspreadsheet,
			resource : {
				valueInputOption: 'RAW',
				data: [],
			},
		};

		const command = args.shift().toLowerCase();

		// function for language command to collect the language wanted by the user
		function languageCheck() {
			let language;
			// if the user has not entered a language create the array of possible languages
			if (!args.length) {
				langNames[0].forEach(lang => {
					langNames[1].push(tongue.language[lang].summary);
				});
				let possibleLanguages = '';
				langNames[1].forEach((lang, i) => {
					const custom = {
						language : langNames[0][i],
						summary : lang,
					};
					possibleLanguages += tongue.says(message, chapterTitle, 'possiblelanguage', custom);
				});
				const custom = { possibleLanguages : possibleLanguages };
				message.channel.send(tongue.says(message, chapterTitle, 'languageselect', custom));
				// ask the user the language wanted
				language = tell.askUser(message, 10);
			}
			else {
				// if the user has entered a language after the command store it
				language = args.shift().toLowerCase();
			}
			// return the language
			return language;
		}

		// language command for the guild
		if (command === 'lang' || command === 'language') {
			// check if the guild is referenced as premium guild
			if (!premiumGuildIds.includes(message.guild.id)) {
				return message.channel.send(tongue.says(message, chapterTitle, 'adminemptyfirst'));
			}
			const language = languageCheck();
			// check if the language is possible for the bot
			if (langNames[0].includes(language)) {
				// change the guild language
				message.guild.language = language;
				// store the guild language in premium spreadsheet
				updateRequest.resource.data.push({
					range: `${gangSheetTitle}!E${gangLine + 1}:E${gangLine + 1}`,
					values: [language],
				});
				gsheetlink.updateValues(updateRequest);
				// tell the user the language is set
				const summary = langNames[1][langNames[0].indexOf(language)];
				const custom = { summary : summary };
				return message.channel.send(tongue.says(message, chapterTitle, 'languageset', custom));
			}
			// tell the user there is no proper language
			return message.channel.send(tongue.says(message, chapterTitle, 'adminnolanguage'));
		}

		// language command for the player
		if (command === 'mylang' || command === 'mylanguage') {
			const language = languageCheck();
			// check if the language is possible for the bot
			if (langNames[0].includes(language)) {
				// change the player language
				message.author.language = language;
				// store the player language in premium spreadsheet
				updateRequest.resource.data.push({
					range: `${playerSheetTitle}!C${playerLine + 1}:C${playerLine + 1}`,
					values: [language],
				});
				gsheetlink.updateValues(updateRequest);
				// tell the user the language is set
				const summary = langNames[1][langNames[0].indexOf(language)];
				const custom = { summary : summary };
				return message.channel.send(tongue.says(message, chapterTitle, 'languageset', custom));
			}
			// tell the user there is no proper language
			return message.channel.send(tongue.says(message, chapterTitle, 'adminnolanguage'));
		}

		// default language command for the bot
		if (command === 'globallang' || command === 'globallanguage') {
			// check if the user is the owner of the bot
			if (message.author.id !== ownerID) {
				return message.channel.send(tongue.says(message, chapterTitle, 'owneronly'));
			}
			const language = languageCheck();
			// check if the language is possible for the bot
			if (langNames[0].includes(language)) {
				// launche the function to change language
				tongue.setLanguage(language);
				// tell the user the language is set
				const summary = langNames[1][langNames[0].indexOf(language)];
				const custom = { summary : summary };
				return message.channel.send(tongue.says(message, chapterTitle, 'globallanguageset', custom));
			}
			// tell the user there is no proper language
			return message.channel.send(tongue.says(message, chapterTitle, 'adminnolanguage'));
		}

		// command to set the default channel for the guild
		if (command === 'channel' || command === 'chan') {

			// get the channel ID of the channel the message was sent in
			const channelId = message.channel.id;
			// update the guild with the new default channel
			message.guild.update.channel = channelId;

			// tell the user the channel is set
			const custom = {
				channelName : message.channel.name,
			};
			message.channel.send(tongue.says(message, chapterTitle, 'channelset', custom));

			const updateMessages = this.hostUpdate.messages;

			const messageArray = [];

			for (const entry of updateMessages.entries()) {

				const mess = {
					embeds : entry[1].embeds,
					components : entry[1].components,
					files : Array.from(entry[1].attachments.values()),
				};
				if (entry[1].content !== '') mess.content = entry[1].content;

				messageArray.push(mess);
			}

			const messageUpdateList = [];

			while (messageArray.length) {
				const mess = messageArray.shift();
				const messSend = await message.channel.send(mess);
				messageUpdateList.push(messSend.id);
			}

			// update the guild data with the messages ID
			message.guild.update.messages = messageUpdateList;

			// update the spreadsheet
			updateRequest.resource.data.push({
				range: `${gangSheetTitle}!F${gangLine + 2}:G${gangLine + 2}`,
				values: [[channelId, messageUpdateList.join(',')]],
			});
			gsheetlink.updateValues(updateRequest);


		}
	},

	async batchUpdate(parameter, guilds, message) {
		// parameter can be new, edit or delete
		const updateRequest = {
			spreadsheetId : premiumspreadsheet,
			resource : {
				valueInputOption: 'RAW',
				data: [],
			},
		};
		// create a clone of the message to send in premium guilds
		const mess = {
			embeds : message.embeds,
			components : message.components,
			files : Array.from(message.attachments.values()),
		};
		if (message.content !== '') mess.content = message.content;

		// send the message in all premium guilds with a referenced channel
		for (let i = 0; i < guilds.length; i++) {
			const guild = message.client.guilds.cache.get(guilds[i]);
			const channel = await message.client.channels.fetch(guild.update.channel);
			if (channel) {
				let messSend;
				if (parameter === 'new') {
					messSend = await channel.send(mess);
					guild.update.messages.push(messSend.id);
				}
				else {
					const updateMessages = this.hostUpdate.messages;

					const messageArray = [];

					for (const entry of updateMessages.entries()) {
						messageArray.push(entry[1].id);
					}

					const index = messageArray.indexOf(message.id);
					const messId = guild.update.messages[index];
					const chan = await message.client.channels.fetch(guild.update.channel);
					const messEdit = await chan.messages.fetch(messId);
					if (parameter === 'delete') {
						messEdit.delete();
						guild.update.messages.splice(index, 1);
					}
					else if (parameter === 'edit') {
						messEdit.edit(mess);
					}
				}
				if (parameter !== 'edit') {
					const gangLine = premiumGuildIds.indexOf(guild.id);
					updateRequest.resource.data.push({
						range: `${gangSheetTitle}!F${gangLine + 2}:G${gangLine + 2}`,
						values: [[guild.update.channel, guild.update.messages.join(',')]],
					});
				}
			}
		}
		gsheetlink.updateValues(updateRequest);
		if (parameter === 'delete') {
			this.hostUpdate.messages.delete(message.id);
		}
	},


};
