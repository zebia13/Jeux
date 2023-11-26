const Discord = require('discord.js');
const replies = require('./replies.js');

let defaultLanguage;
let languageSheetrequestId;
let discordOwnerID;
let prefix;
let separatorStart;
let separatorEnd;
let emojiorStart;
let emojiorEnd;
let footers;
let language = {};
let client;

const adminTitle = 'adm';

// function to initialize the language module, it exports the languages files, the footers and the permission to write new elements
async function initialize(items) {
	// if the keyword tongue is used, reload the replies
	if (items === 'tongue') {
		const tongueitem = { languagespreadsheet : languageSheetrequestId };
		replies.initialize(tongueitem);
	}
	else {
		// load the bot data for the module
		defaultLanguage = items.formating.defaultLanguage;
		prefix = items.prefix;
		separatorStart = items.formating.separatorStart;
		separatorEnd = items.formating.separatorEnd;
		emojiorStart = items.formating.emojiorStart;
		emojiorEnd = items.formating.emojiorEnd;
		discordOwnerID = items.discordownerid;
		languageSheetrequestId = items.spreadsheets.languagespreadsheet;
	}
	// create the language items : footers, permission and language
	footers = replies.footers;
	const permission = replies.permission;
	exports.permission = permission;
	language = replies.language;
	exports.language = language;
	exports.defaultLanguage = defaultLanguage;
	return 'tongue ready';
}
// function to set the default language of the bot
function setLanguage(lang) {
	if (language[lang].chapter != undefined) {
		defaultLanguage = lang;
		this.defaultLanguage = defaultLanguage;
		return language[lang].summary;
	}
}

// error function when an error occur with the speaking module
function error(message, file, situation) {
	const custom = {
		message : message,
		file : file,
		situation : situation,
	};
	message.channel.send(says(message, adminTitle, 'tongueerror', custom));
	// send a DM to the author about the bug
	message.client.users.fetch(discordOwnerID).then(user => {
		user.send(says(message, adminTitle, 'ownererror', custom));
	});
}

// function to translate the custom part of the message in text to be shown
function translate(text, custom) {
	let totalcontent = '';
	// search for any separator left in the text
	while (text.indexOf(separatorStart) > -1) {
		// cut the text before the separator
		totalcontent += text.slice(0, text.indexOf(separatorStart));
		// find the custom text in custom.object and store it
		let customText = `${custom[text.slice(text.indexOf(separatorStart) + separatorStart.length, text.indexOf(separatorEnd))]}`;
		// delete the \n in custom text
		while (customText.endsWith('\n')) {
			customText = customText.slice(0, -1).trim();
		}
		// load the custom text in the total content
		totalcontent += customText;
		// cut the custom text part in the main text before moving to the next
		text = text.slice(text.indexOf(separatorEnd) + separatorEnd.length);
	}
	totalcontent += text;
	let finalcontent = '';
	// search for any separator left in the text
	while (totalcontent.indexOf(emojiorStart) > -1) {
		// cut the text before the separator
		finalcontent += totalcontent.slice(0, totalcontent.indexOf(emojiorStart));
		// find the custom text in custom.object and store it
		let emojiRef = totalcontent.slice(totalcontent.indexOf(emojiorStart) + emojiorStart.length, totalcontent.indexOf(emojiorEnd));
		// delete the \n in custom text
		while (emojiRef.endsWith('\n')) {
			emojiRef = emojiRef.slice(0, -1).trim();
		}
		if (emojiRef.startsWith(':') && emojiRef.endsWith(':')) emojiRef.slice(1, -1);
		let emoji;
		if (!isNaN(Number(emojiRef))) {
			emoji = client.emojis.cache.find(emo => emo.id === emojiRef);
		}
		else {
			emoji = client.emojis.cache.find(emo => emo.name === emojiRef);
		}
		if (emoji == undefined) emoji = `:${emojiRef}:`;
		// load the custom text in the total content
		finalcontent += `${emoji}`;
		// cut the custom text part in the main text before moving to the next
		totalcontent = totalcontent.slice(totalcontent.indexOf(emojiorEnd) + emojiorEnd.length);
	}
	finalcontent += totalcontent;
	return finalcontent;
}

// function to return a message
function says(message, file, situation, custom) {

	client = message.client;

	// avoid error with empty message or message without custom text
	if (!custom) custom = {};
	if (!message) {
		message = {
			author:'',
			member:'',
		};
	}

	// define the custom preset author and nickname
	custom['nickname'] = message.author.username;
	if (message.member !== null) custom['nickname'] = message.member.displayName;
	custom['author'] = message.author;
	custom['prefix'] = prefix;
	// define the player language to display the proper answer
	let playerLanguage;
	if (file == 'admin') {
		playerLanguage = 'admin';
	}
	else {
		if (message.guild) {
			if (message.guild.language) {
				if (message.guild.language !== 'default') {
					playerLanguage = message.guild.language;
				}
			}
		}
		if (message.author.language) {
			if (message.author.language !== 'default') {
				playerLanguage = message.author.language;
			}
			else {
				playerLanguage = defaultLanguage;
			}
		}
		else {
			playerLanguage = defaultLanguage;
		}
	}

	// choose a footer among the possible footers
	if (language[playerLanguage].footers) {
		footers = language[playerLanguage].footers;
	}
	const rngfooter = Math.floor(Math.random() * footers.length);
	custom['footer'] = footers[rngfooter];
	// get the chapter of the command : commandFile
	let commandFile;
	if (language[playerLanguage].chapter.has(file)) {
		commandFile = language[playerLanguage].chapter.get(file).attributes;
	}
	else {
		for (const lang in language) {
			if (language[lang].chapter.has(file)) commandFile = language[lang].chapter.get(file).attributes;
		}
		if (!commandFile) return error(message, file, situation);
	}

	let commandSituation;
	if (commandFile.has(situation)) {
		// get the situation talk
		commandSituation = commandFile.get(situation);
	}
	else if (commandFile.has('error')) {
		commandSituation = commandFile.get('error');
	}
	else {
		return error(message, file, situation);
	}

	// check if there are commands in the situation
	if (commandSituation.content.commands.size > 0) {
		let isEmbed = false;
		let isButton = false;
		const returnedMessage = {
			embeds : [],
			components : [],
		};
		if (commandSituation.content.text) returnedMessage.content = translate(commandSituation.content.text, custom);
		// check if an embed message
		if (commandSituation.content.commands.has('embed')) {
			isEmbed = true;
			const embedsValues = commandSituation.content.commands.get('embed');
			const embedsArray = embedsValues[0].split(/, +/);
			const embeds = {};
			embedsArray.forEach(embed => {
				embed = embed.trim();
				embeds[embed] = {};
			});
			commandSituation.content.commands.forEach((value, key) => {
				let embedRef;
				for (const embed in embeds) {
					if (key.includes(embed)) {
						key = key.replace(embed, '').trim();
						embedRef = embed;
					}
				}
				if (key === 'color') {
					const colorValue = translate(value[0], custom).split(',').map(color => Number(color));
					embeds[embedRef].color = colorValue;
				}
				else if (key === 'title') {
					embeds[embedRef].title = translate(value[0], custom);
				}
				else if (key === 'description') {
					embeds[embedRef].description = translate(value[0], custom);
				}
				else if (key === 'footer') {
					embeds[embedRef].footer = translate(value[0], custom);
				}
				else if (key === 'thumbnail') {
					embeds[embedRef].thumbnail = translate(value[0], custom);
				}
				else if (key.startsWith('addfield')) {
					if (!embeds[embedRef].addfields) embeds[embedRef].addfields = {};
					embeds[embedRef].addfields[key] = [translate(value[0], custom), translate(value[3], custom), (value[2] == 'true' || value[2] == '1')];
					// addfield (title, description, inline : boolean)
				}
				else if (key === 'image') {
					embeds[embedRef].image = translate(value[0], custom);
				}
				else if (key === 'url') {
					embeds[embedRef].url = translate(value[0], custom);
				}
			});
			for (const embed in embeds) {
				const sayembed = new Discord.MessageEmbed();
				if (embeds[embed].color) {
					sayembed.setColor(embeds[embed].color);
				}
				if (embeds[embed].title) {
					sayembed.setTitle(embeds[embed].title);
				}
				if (embeds[embed].description) {
					sayembed.setDescription(embeds[embed].description);
				}
				if (embeds[embed].footer) {
					sayembed.setFooter(embeds[embed].footer);
				}
				if (embeds[embed].thumbnail) {
					sayembed.setThumbnail(embeds[embed].thumbnail);
				}
				if (embeds[embed].image) {
					sayembed.setImage(embeds[embed].image);
				}
				if (embeds[embed].url) {
					sayembed.setURL(embeds[embed].url);
				}
				if (embeds[embed].addfields) {
					for (const fields in embeds[embed].addfields) {
						if (embeds[embed].addfields[fields][2]) {
							sayembed.addField(embeds[embed].addfields[fields][0], embeds[embed].addfields[fields][1], embeds[embed].addfields[fields][2]);
						}
						else {
							sayembed.addField(embeds[embed].addfields[fields][0], embeds[embed].addfields[fields][1]);
						}
					}
				}
				returnedMessage.embeds.push(sayembed);
			}
		}
		// check if a button
		if (commandSituation.content.commands.has('button')) {
			isButton = true;
			let buttonsValues = commandSituation.content.commands.get('button');
			buttonsValues = buttonsValues[0];
			const buttonsArray = [];
			// search for any separator left in the text
			if (buttonsValues.indexOf('\n') === -1) buttonsArray.push(buttonsValues.split(/, +/));
			while (buttonsValues.indexOf('\n') > -1) {
				// cut the text before the separator
				buttonsArray.push(buttonsValues.slice(0, buttonsValues.indexOf('\n')).split(/, +/));
				// cut the custom text part in the main text before moving to the next
				buttonsValues = buttonsValues.replace('\n', '');
			}
			const buttons = {};
			buttonsArray.forEach(line => {
				const sayRow = new Discord.MessageActionRow();
				line.forEach(button => {
					button = button.trim();
					buttons[button] = {};
				});
				commandSituation.content.commands.forEach((value, key) => {
					let buttonRef;
					for (const button in buttons) {
						if (key.includes(button)) {
							key = key.replace(button, '').trim();
							buttonRef = button;
						}
					}
					if (key === 'id') {
						buttons[buttonRef].id = translate(value[0], custom);
					}
					else if (key === 'text') {
						buttons[buttonRef].label = translate(value[0], custom);
					}
					else if (key === 'emoji') {
						buttons[buttonRef].emoji = translate(value[0], custom);
					}
					else if (key === 'disabled') {
						buttons[buttonRef].disabled = Boolean(translate(value[0], custom));
					}
					else if (key === 'link') {
						buttons[buttonRef].url = translate(value[0], custom);
					}
					else if (key === 'style') {
						let cellValue = translate(value[0], custom).toUpperCase();
						const possibleValues = ['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER', 'LINK'];
						if (!possibleValues.includes(cellValue)) cellValue = 'PRIMARY';
						buttons[buttonRef].style = translate(value[0], custom);
					}
				});
				for (const button in buttons) {
					const newButton = new Discord.MessageButton();
					if (buttons[button].id) {
						newButton.setCustomId(buttons[button].id);
					}
					else if (button) {
						newButton.setCustomId(button);
					}
					else {
						newButton.setCustomId('button');
					}
					if (buttons[button].label) {
						newButton.setLabel(buttons[button].label);
					}
					if (buttons[button].style) {
						newButton.setStyle(buttons[button].style);
					}
					if (buttons[button].emoji) {
						newButton.setEmoji(buttons[button].emoji);
					}
					if (buttons[button].disabled) {
						newButton.setDisabled(buttons[button].disabled);
					}
					if (buttons[button].url) {
						newButton.setURL(buttons[button].url);
					}
					if (newButton.url) delete newButton.customId;
					sayRow.addComponents([newButton]);
				}
				returnedMessage.components.push(sayRow);
			});
		}
		// use the commands as custom parameters
		if (!isEmbed && !isButton) {
			let mess = [];
			mess.push(translate(commandSituation.content.text, custom));
			commandSituation.content.commands.forEach((value, key) => {
				if (custom[key]) mess.push(translate(value[0], custom));
			});
			mess = mess.join('\n');
			return mess;
		}
		if (!isEmbed) {
			delete returnedMessage.embeds;
		}
		if (!isButton) {
			delete returnedMessage.components;
		}
		return returnedMessage;
	}
	else {
		return translate(commandSituation.content.text, custom);
	}
}

// function to send a splitted message and eventually send a link
// works with the original message send by the user (to reply in the channel or in dm)
// with the message that has to be sent
// with a boolean (dm) to know if the answer is supposed to be send in dm or not
async function sendSplitMessage(message, messagetosplit, dm) {
	let components;
	if (typeof messagetosplit === 'object') {
		components = messagetosplit.components;
		messagetosplit = messagetosplit.content;
	}
	if (dm === undefined || typeof dm !== 'boolean') {
		dm = false;
	}
	else {
		dm = Boolean(dm);
	}
	let returnMess;
	const messagearray = [];
	// split the message to send with the links included in the message
	if (messagetosplit.indexOf('http') > -1) {
		while (messagetosplit.indexOf('http') > -1) {
			const messagetocut = Discord.Util.splitMessage(messagetosplit.slice(0, messagetosplit.indexOf('http')));
			const messageLink = messagetocut.pop();
			if (messagetocut[0] !== undefined) {
				messagetocut.forEach(cut => {
					messagearray.push(cut);
				});
			}
			messagetosplit = messagetosplit.slice(messagetosplit.indexOf('http'));
			messagearray.push({ content : messageLink, files : [messagetosplit.slice(0, messagetosplit.indexOf('\n'))] });
			messagetosplit = messagetosplit.slice(messagetosplit.indexOf('\n'));
		}
	}
	const messagetocut = Discord.Util.splitMessage(messagetosplit);
	messagetocut.forEach(cut => {
		messagearray.push(cut);
	});
	if (components) {
		let lastmessage = messagearray.pop();
		lastmessage = { content : lastmessage, components : components };
		messagearray.push(lastmessage);
	}
	for (const row of messagearray) {
		let empty = false;
		if (typeof row === 'string') {
			if (row.replace(/\n/g, '') === '') empty = true;
		}
		if (!empty) {
			if (dm) {
				returnMess = await message.author.send(row);
			}
			else {
				returnMess = await message.channel.send(row);
			}
		}
	}
	// the function return the last message send by the bot
	return returnMess;
}

exports.initialize = initialize;
exports.says = says;
exports.translate = translate;
exports.setLanguage = setLanguage;
exports.sendSplitMessage = sendSplitMessage;
