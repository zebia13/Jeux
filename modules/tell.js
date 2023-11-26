const Diacritics = require ('diacritic');
const tongue = require('./tongue.js');
const _ = require('lodash');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('./api-gsheet.js');
let prefix;
let userItemsArray;
let emojiTellAction;

const chapterTitle = 'tell';

async function initialize(items) {
	// load the bot data for the module
	prefix = items.prefix;
	userItemsArray = items.userItems;
	emojiTellAction = items.formating.emojiTellActions;
	return 'tell ready';
}


// function to collect an interaction with a button, return button clicked.
// targetuser is an optionnal discord user and is used to filter the interaction with someone else than the author
// replaceLabel is an optionnal object to change the buttons labels
// replaceText is an optionnal text for the message once the button is clicked
async function buttonUser(message, timesec, targetUser, replaceLabel, replaceText) {
	if (timesec == undefined) timesec = 10;
	if (targetUser == undefined) targetUser = message.author;
	if (!replaceText) replaceText = message.content;
	return new Promise(function(resolve, reject) {
		const filter = (interaction) => interaction.user.id === targetUser.id;
		const collector = message.createMessageComponentCollector({ filter, time: timesec * 1000 });
		collector.on('collect', async interaction => {
			const componentsArray = interaction.message.components;
			componentsArray.forEach(row => {
				row.components.forEach(button => {
					button.disabled = true;
				});
			});
			await interaction.update({ content : replaceText, components : componentsArray });
			resolve (interaction.customId);
		});
		collector.on('end', collected => {
			if (collected.size < 1) reject('problem');
			reject('timeout');
		});
	});
}

// function to ask something to someone, return the message content send.
// dm is boolean and is used to send a message by dm
// targetuser is a discord user and is used to tag or to send a dm to a defined user
// text is an optionnal text sent before collecting the answer
async function askUser(message, timesec, dm, targetUser, text) {
	if (timesec == undefined) timesec = 10;
	if (targetUser == undefined) targetUser = message.author;
	if (dm) {
		message.channel = await targetUser.createDM();
	}
	if (text) {
		tongue.sendSplitMessage(message, `${targetUser}\n${text}`);
	}
	return new Promise(function(resolve, reject) {
		const filter = m => m.author.id === targetUser.id;
		const collector = message.channel.createMessageCollector ({ filter, time: timesec * 1000 });
		// attach the collector to the user to stop it out of the function
		if (message.author.play) message.author.play.collector = collector;
		collector.on('collect', m => {
			resolve (m.content);
		});
		collector.on('end', collected => {
			if (collected.size < 1) reject('problem');
			reject('timeout');
		});
	});
}

// function to ask something on a channel, return the collected message.
// dm is boolean and is used to send a message by dm
// targetuser is a discord user and is used to tag or to send a dm to a defined user
// text is an optionnal text sent before collecting the answer
async function askAll(message, timesec, channel, text) {
	if (timesec == undefined) timesec = 10;
	if (channel) {
		message.channel = channel;
	}
	if (text) {
		tongue.sendSplitMessage(message, text);
	}
	let answer = new Promise(function(resolve, reject) {
		const filter = m => !m.content.toLowerCase().startsWith(prefix);
		const collector = channel.createMessageCollector ({ filter, time: timesec * 1000 });
		collector.on('end', collected => {
			if (collected.size < 1) reject ('timeout');
			resolve (collected);
		});
	}).catch (err => {
		answer = err;
	});
	return answer;
}

// function to react to a message and register the user reactions
// text is the message send with emoji as an Array of emojis.id to react on
// dm is Boolean to know if the message should be send in dm
// targetuser is the discord user that should react to the message, if blank it's the author of the initial message
// the function return the emoji.id the targetUsed reacted on.
async function reactUser(message, text, emojis, timesec, dm, targetuser) {
	if (timesec == undefined) timesec = 20;
	if (message == undefined) message = { author : targetuser };
	if (targetuser == undefined) targetuser = message.author;
	if (dm) {
		message.channel = await targetuser.createDM();
	}
	const sent = await tongue.sendSplitMessage(message, text, dm);
	for (let i = 0; i < emojis.length; i++) {
		await sent.react(emojis[i]);
	}
	let answer = new Promise(function(resolve, reject) {
		const filter = (reaction, user) => {
			return (emojis.includes(reaction.emoji.id) || emojis.includes(reaction.emoji.name)) && user.id === targetuser.id;
		};
		const reactcollector = sent.createReactionCollector({ filter, time: timesec * 1000 });
		reactcollector.on('collect', (reaction) => {
			resolve (reaction.emoji);
		});
		reactcollector.on('end', (collected, reason) => {
			if (reason === 'restart') reject('restart');
			if (collected.size < 1) reject('problem');
			reject('timeout');
		});
		const writeFilter = m => {
			return m.author.id === targetuser.id && ((m.content.includes('quit') || m.content.includes('stop')));
		};
		const writecollector = sent.channel.createMessageCollector ({ writeFilter, time: timesec * 1000 });
		writecollector.on('collect', m => {
			resolve (m.content);
		});
	}).catch (err => {
		answer = err;
	});
	return answer;
}

// react all send a text to a defined channel, the bot will react to that text with emoji : an Array of emojis.id
// The function return an array of reaction
async function reactAll(message, text, emojis, timesec, channel) {
	if (timesec == undefined) timesec = 10;
	if (channel == undefined) channel = message.channel;
	let answer = new Promise(function(resolve, reject) {
		channel.send(tongue.sendSplitMessage(message, text)).then (sent => {
			for (let i = 0; i < emojis.length; i++) {
				sent.react(emojis[i]);
			}
			const filter = (reaction, user) => {
				return (emojis.includes(reaction.emoji.id) || emojis.includes(reaction.emoji.name)) && user.id !== message.client.id;
			};
			const reactcollector = sent.createReactionCollector({ filter, time: timesec * 1000 });
			reactcollector.on('end', collected => {
				if (collected.size < 1) reject ('timeout');
				resolve (collected);
			});
		}).catch (err => {
			answer = err;
		});
	});
	return answer;
}

// I can add a return button, I can add points for quizz... I must add attributes for USER for privilege guides
async function play(message, playingItem, buttons) {
// add a paramter in the guide or story to use buttons, to have a return button or not, to save the progression...
// important : save the progression = load a spreadsheet for players with the datas
	// the playing command can have a button option, if false, it will be necessary to write the keywords
	if (buttons === undefined) buttons = false;
	// returnedItem is the object that will be returned at the end {content : the message that will be displayed / title : the title of the doc / way : the total way}
	const returnedItem = {};
	// if nodm is true, the messages will be send in a guild channel
	let nodm = false;
	const custom = {};
	custom.emojiTellAction = emojiTellAction;
	let paragraph = '';
	let input = 'quit';
	// default time to collect a move in second
	const defaultAnswerTime = 600;
	const shortAnswerTime = 30;

	// create the user attributes in the playingItem if there is such an attributes in the author attributes
	if (playingItem.user.attributes) {
		const attributesList = playingItem.attributes.all.map(cell => cell[0]);
		const itemsList = playingItem.items.all.map(cell => cell[0]);

		userItemsArray.forEach(item => {
			if (message.author[item]) {
				if (typeof message.author[item] === 'object') {
					for (const prop in message.author[item]) {
						if (attributesList.includes(`${item}_${prop}`) || itemsList.includes(`${item}_${prop}`)) {
							playingItem.user.attributes.start[`${item}_${prop}`] = message.author[item][prop];
							playingItem.user.attributes.actual[`${item}_${prop}`] = message.author[item][prop];
						}
					}
				}
				else if (attributesList.includes(item) || itemsList.includes(item)) {
					playingItem.user.attributes.start[item] = message.author[item];
					playingItem.user.attributes.actual[item] = message.author[item];
				}
			}
		});
	}

	// check if there are config items in the playingItem
	playingItemConfig(playingItem);

	function playingItemConfig(playItem) {
		if (playItem.items) {
			const itemsList = playItem.items.all.map(cell => cell[0]);
			const itemsComplete = playItem.items.all.map(cell => cell[1]);
			if (itemsList.includes('emoji')) {
				let emoji = itemsComplete[itemsList.indexOf('emoji')];
				emoji = emoji.slice(emoji.indexOf('=') + 1).trim();
				emoji = tongue.translate(emoji, custom);
				custom.emojiTellAction = emoji;
			}
		}
	}

	if (message.author.play) {
		if (message.author.play.collector) message.author.play.collector.stop('restart');
		// if yes send a message and ask to end it
		custom.title = message.author.play.title;
		custom.way = '';
		message.author.play.way.forEach(step => {
			custom.way = `${custom.way}${step[2]} `;
		});
		// if the object is complex
		let messageSend;
		// try to send a message to the author to start the complex item
		try {
			messageSend = await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'alreadyreading', custom), !nodm);
		}
		// if DM are locked send it in guild channel
		catch(e) {
			console.log(e);
			// block dm for the following steps
			nodm = true;
			if (message.channel.type !== 'DM') {
				message.channel.send(tongue.says(message, chapterTitle, 'problemdm', custom));
				messageSend = await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'alreadyreading', custom), !nodm);
			}
			else {
				delete message.author.play;
				return;
			}
		}
		// use buttons to start the item
		try {
			input = await buttonUser(messageSend, shortAnswerTime, message.author);
		}
		// if no button pressed, quit
		catch(e) {
			input = 'quit';
		}
		if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('y')) {
			playingItem = await gsheetlink.translateDoc({ documentId : message.author.play.id });
			playingItemConfig(playingItem);
			playingItem.user.attributes.actual = message.author.play.attributes;
			paragraph = message.author.play.way.pop()[0];
			message.author.play.reload = true;
		}
		else {
			delete message.author.play;
		}
	}
	// the title is the title of the doc
	let title = playingItem.doc.title;
	// if there is a title mentionned in the doc it is used instead of the title of the doc
	if (playingItem.title) title = playingItem.title;
	custom.title = title;
	returnedItem.title = title;
	// if there is a summary referenced in the doc it is used as summary
	custom.summary = '';
	if (playingItem.summary) custom.summary = playingItem.summary;
	// if there are authors referenced in the doc they are used as authors
	if (playingItem.authors) {
		custom.authors = playingItem.authors;
	}
	else {
		// if no authors a default sentence is used
		custom.authors = tongue.says(message, chapterTitle, 'noauthors', custom);
	}
	// check if the doc is complexe or a single chapter to display
	if (playingItem.chapter.size === 1) {
		// load the first chapter
		if (paragraph === '') paragraph = playingItem.chapter.entries().next().value[0];
		const chapter = playingItem.chapter.get(paragraph);
		const chaptertitle = chapter.title;
		let storytelling = '';
		// check the attributes of the chapter
		chapter.attributes.forEach(att => {
			// use the check function of the attribute
			if (playingItem.attributes) att.check(att.name, playingItem.user.attributes.actual);
			// if the result of the function is true
			if (att.true) {
				// add the text of the attribute
				if (att.content.text) storytelling += att.content.text;
			}
		});
		// load the custom object to display the data requested
		if (chaptertitle) custom.title = tongue.translate(chaptertitle, custom);
		custom.chapter = tongue.translate(storytelling, custom);
		custom.chapterCommands = '';
		custom.telling = tongue.says(message, chapterTitle, 'telling', custom);
		// load the content to display in returnedObject
		returnedItem.content = tongue.says(message, chapterTitle, 'sent', custom);
		try {
			tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, '1chapter', custom), true);
		}
		catch(e) {
			if (message.channel.type !== 'DM') {
				tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, '1chapter', custom));
			}
		}
		// end the function and send returnedObject
		return returnedItem;
	}
	if (!message.author.play) {
		// if the object is complex
		let messageSend;
		// try to send a message to the author to start the complex item
		try {
			messageSend = await message.author.send(tongue.says(message, chapterTitle, 'begin', custom));
			if (message.channel.type !== 'DM')	message.channel.send(tongue.says(message, chapterTitle, 'sent', custom));
		}
		// if DM are locked send it in guild channel
		catch(e) {
			// block dm for the following steps
			nodm = true;
			if (message.channel.type !== 'DM') {
				message.channel.send(tongue.says(message, chapterTitle, 'problemdm', custom));
				messageSend = await message.channel.send(tongue.says(message, chapterTitle, 'begin', custom));
			}
			else {
				return;
			}
		}
		// use buttons to start the item
		try {
			input = await buttonUser(messageSend, shortAnswerTime, message.author);
		}
		// if no button pressed, quit
		catch(e) {
			input = 'quit';
		}
		if (input === undefined) input = 'quit';
	}
	// special command functions
	async function specialCommand(special, commands, move) {
		const returnedSpecial = { paragraph : '', chapterCommands :'', custom : {} };
		returnedSpecial.custom.move = move;
		returnedSpecial.custom.warning = '';
		let commandsText = '';
		if (special === '') {
			console.log('no special command registered');
			returnedSpecial.paragraph = commands.entries().next().value[2];
		}
		// a poem is valid if the input includes enough words of the command, the required number of words is defined by the number after the '-' in the comand key
		// the number before the - is the number of words that must be in the poem
		else if (special === 'poem') {
			// create an array with the player input with only words inside
			const moveArray = move.match(/[^\s,?;.://!]+/g);
			commands.forEach(value => {
				// create an array with all the words in the cell
				let valueArray = Diacritics.clean(value[0]).toLowerCase().match(/[^\s,?;.://!]+/g);
				// use the end of the second cell as a reference
				let limiter = value[1].slice(value[1].indexOf('-') + 1);
				const minNumber = value[1].slice(0, value[1].indexOf('-'));
				if (isNaN(limiter)) limiter = 0;
				// compare the tables
				valueArray = _.difference(valueArray, moveArray);
				// if the number of words in the command value array is less than the reference and as enough words, the move is valid
				if (valueArray.length <= Number(limiter) && moveArray.length >= Number(minNumber)) {
					returnedSpecial.paragraph = value[2];
				}
				else {
					if (valueArray.length > Number(limiter)) returnedSpecial.custom.warning = `${returnedSpecial.custom.warning}${tongue.says('', chapterTitle, 'specialpoemwronganswer', custom)}`;
					if (moveArray.length < Number(minNumber)) returnedSpecial.custom.warning = `${returnedSpecial.custom.warning}${tongue.says('', chapterTitle, 'specialpoemshortanswer', custom)}`;
				}
			});
		}
		else {
			returnedSpecial.paragraph = commands.entries().next().value[2];
		}
		commands.forEach((value, key) => {
			custom.text = value[0];
			custom.move = key;
			if (!(value[0].toLowerCase() === 'secret' || value[1].toLowerCase() === 'end' || value[1].toLowerCase() === 'special')) commandsText += tongue.says(message, chapterTitle, 'chaptercommand', custom);
		});
		returnedSpecial.chapterCommands = commandsText;
		return returnedSpecial;
	}
	// if the players start the item
	if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('y')) {
		try {
			if (!message.author.play) message.author.play = {};
			message.author.play.title = title;
			message.author.play.id = playingItem.doc.id;
			if (playingItem.user.attributes) message.author.play.attributes = playingItem.user.attributes.actual;
			if (!message.author.play.way) message.author.play.way = [];
			if (paragraph === '') paragraph = playingItem.chapter.entries().next().value[0];
			let end = false;
			let result = '';
			while (!end) {
				if (!playingItem.chapter.has(paragraph)) throw `there is no paragraph with ${paragraph} registered`;
				const chapter = playingItem.chapter.get(paragraph);
				const chaptertitle = chapter.title;
				let summary = '';
				let telling = '';
				const commands = new Map();
				let commandsText = '';
				chapter.attributes.forEach(att => {
					if (playingItem.attributes) att.check(att.name, playingItem.user.attributes.actual);
					if (att.true) {
						if (att.content.text) telling += att.content.text;
						if (att.content.summary) summary += att.content.summary;
						if (att.content.commands) {
							att.content.commands.forEach((value, key) => {
								commands.set(key, value);
							});
						}
						// if the player reload the game don't run the items of the pragraph
						if (!message.author.play.reload) {
							if (att.content.items) {
								att.content.items.items.forEach(item => {
									att.content.items.run(item, playingItem.user.attributes.actual);
								});
							}
						}
					}
				});
				message.author.play.reload = false;
				playingItem.user.way.push([paragraph, chapter.title, summary]);
				message.author.play.way.push([paragraph, chapter.title, summary]);
				custom.title = tongue.translate(chaptertitle, custom);
				custom.chapter = tongue.translate(telling, custom);
				commands.forEach((value, key) => {
					custom.text = value[0];
					custom.move = key;
					if (!(value[0].toLowerCase() === 'secret' || value[1].toLowerCase() === 'end' || value[1].toLowerCase() === 'special')) commandsText += tongue.says(message, chapterTitle, 'chaptercommand', custom);
				});
				custom.chapterCommands = tongue.translate(commandsText, custom);
				// special command values : end
				if (commands.has('end')) {
					custom.chapterCommands = '';
					await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'telling', custom), !nodm);
					const endText = commands.get('end');
					end = true;
					result += `${endText[0]}\n`;
				}
				else if (commands.has('special')) {
					let special = commands.get('special');
					const text = special[0];
					special = special[2];
					// insert a function
					commands.delete('special');
					custom.chapterCommands = tongue.translate(text, custom);
					await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'telling', custom), !nodm);
					let move;
					try {
						move = await askUser(message, defaultAnswerTime, !nodm);
					}
					catch(e) {
						move = 'quit';
						if (e === 'restart') move = 'stop';
					}
					if (move === undefined) move = 'quit';
					move = Diacritics.clean(move).toLowerCase();
					let specialReturn = await specialCommand(special, commands, move);
					paragraph = specialReturn.paragraph;
					if (specialReturn.custom) {
						for (const customReturn in specialReturn.custom) {
							custom[customReturn] = specialReturn.custom[customReturn];
						}
					}
					while (paragraph === '') {
						if (move.slice(0, move.indexOf(' ')) === prefix) move = 'stop';
						if (move === 'quit') {
							returnedItem.way = playingItem.user.way;
							returnedItem.content = tongue.says(message, chapterTitle, 'quit', custom);
							return returnedItem;
						}
						if (move === 'stop') {
							return;
						}
						message.author.send(tongue.says(message, chapterTitle, 'wrongspecialcommand', custom));
						try {
							move = await askUser(message, defaultAnswerTime, true);
						}
						catch(e) {
							move = 'quit';
							if (e === 'restart') move = 'stop';
						}
						move = Diacritics.clean(move).toLowerCase();
						specialReturn = await specialCommand(special, commands, move);
						paragraph = specialReturn.paragraph;
						if (!message.author.play) move = 'quit';
					}
				}
				else {
					await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'telling', custom), !nodm);
					let move;
					try {
						move = await askUser(message, defaultAnswerTime, !nodm);
					}
					catch(e) {
						move = 'quit';
						if (e === 'restart') move = 'stop';
					}
					if (move === undefined) move = 'quit';
					move = Diacritics.clean(move).toLowerCase();
					while (!commands.has(move)) {
						if (move.slice(0, move.indexOf(' ')) === prefix) move = 'stop';
						if (move === 'quit') {
							returnedItem.way = playingItem.user.way;
							returnedItem.content = tongue.says(message, chapterTitle, 'quit', custom);
							return returnedItem;
						}
						if (move === 'stop') {
							return;
						}
						message.author.send(tongue.says(message, chapterTitle, 'wrongcommand', custom));
						try {
							move = await askUser(message, defaultAnswerTime, true);
						}
						catch(e) {
							move = 'quit';
							if (e === 'restart') move = 'stop';
						}
						move = Diacritics.clean(move).toLowerCase();
					}
					const command = commands.get(move);
					paragraph = command[2];
				}
			}
			delete message.author.play;
			returnedItem.content = result;
			return returnedItem;
		}
		// if any problem occurs end the process properly
		catch(e) {
			// unlock the play property
			delete message.author.play;
			console.log(e);
			// load the error text
			returnedItem.content = tongue.says(message, chapterTitle, 'error', custom);
			return returnedItem;
		}
	}
	// at the end of the reading
	else {
		returnedItem.content = tongue.says(message, chapterTitle, 'quit', custom);
		return returnedItem;
	}
}

exports.initialize = initialize;
exports.buttonUser = buttonUser;
exports.askUser = askUser;
exports.askAll = askAll;
exports.reactUser = reactUser;
exports.reactAll = reactAll;
exports.play = play;
