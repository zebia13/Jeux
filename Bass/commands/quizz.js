// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../../modules/api-gsheet.js');
const Diacritics = require ('diacritic');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');
const tell = require ('../../modules/tell.js');

// emojiUnicode is used to check if an emoji is present in the quizz to react
const emojiUnicode = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;

const chapterTitle = 'quizz';

module.exports = {
	name: 'quizz',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 10,
	aliases: ['quiz', 'qz'],
	usage: tongue.says('', chapterTitle, 'usage'),
//warning
	help: false,
	social: false,
	idlemafia: true,
	privacy: 'public',


	async execute(message, args) {

		return;

		// get all the tagged players in a map : quizzPlayers
		const taggedPlayers = [message.author.id];
		if (message.mention.users) {
			message.mention.users.forEach(user => {
				taggedPlayers.push(user.id);
			});
		}
		if (message.mention.members) {
			message.mention.members.forEach(user => {
				taggedPlayers.push(user.id);
			});
		}
		if (message.mention.roles) {
			for (const role of message.mention.roles) {
				await role.fetcch();
				const membersList = role.members;
				membersList.forEach(user => {
					taggedPlayers.push(user.id);
				});
			}
		}
		const quizzPlayers = new Map;
		taggedPlayers.forEach(user => {
			quizzPlayers.set(user, 0);
		});

		// retrieve all the mention from the message content and replace args with the message without mentions
		const command = message.content.replace(/<@.>/g, '').split(' ');
		command.shift();
		args = command;

		const initialchannel = message.channel;

		const custom = {};

		const quizzCommand = {
			players : quizzPlayers,
			style : '',
		};

		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId:`${message.client.data.spreadsheet}`,
			range:'quizz!A2:D',
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		// The quizzs array is created with 3 parts, public, premium and ace
		// The format is quizzsarray[0] for public, [0][1] for quizz table and [0][2] for the list of the titles
		async function collectDatas() {
			const response = await gsheetlink.collectDatas(sheetrequest);
			const quizzarray = [['public', []], ['premium', []], ['ace', []], ['all', []]];
			const publicarray = [];
			const publictitle = [];
			const premiumarray = [];
			const premiumtitle = [];
			const acearray = [];
			const acetitle = [];
			const allarray = [];
			const alltitle = [];
			for (const row of response) {
				allarray.push([row[0], row[1], row[2]]);
				alltitle.push(row[0]);
				if (row[3].includes('public')) {
					publicarray.push([row[0], row[1], row[2]]);
					publictitle.push(row[0]);
				}
				if (row[3].includes('premium')) {
					premiumarray.push([row[0], row[1], row[2]]);
					premiumtitle.push(row[0]);
				}
				if (row[3].includes('ace')) {
					acearray.push([row[0], row[1], row[2]]);
					acetitle.push(row[0]);
				}
			}
			quizzarray[0].push(publictitle);
			quizzarray[0][1] = publicarray;
			quizzarray[1].push(premiumtitle);
			quizzarray[1][1] = premiumarray;
			quizzarray[2].push(acetitle);
			quizzarray[2][1] = acearray;
			quizzarray[3].push(alltitle);
			quizzarray[3][1] = allarray;
			return quizzarray;
		}

		// the datas are an array with the spreadsheet cells content
		const datas = await collectDatas();

		// build the quizz array depending on the player or the guild privilege
		let privilege = 'public';
		let quizzarray = datas[0][1];
		if (message.channel.type !== 'DM') {
			if (message.guild.privilege.premium) {
				quizzarray = datas[1][1];
				privilege = 'premium';
			}
			if (message.guild.privilege.ace) {
				quizzarray = datas[2][1];
				privilege = 'ace';
			}
			if (!message.guild.privilege.ace && message.author.privilege.premium) {
				quizzarray = datas[1][1];
				privilege = 'premium';
			}
			if (message.author.privilege.ace) {
				quizzarray = datas[2][1];
				privilege = 'ace';
			}
		}
		else {
			if (message.author.privilege.premium) {
				quizzarray = datas[1][1];
				privilege = 'premium';
			}
			if (message.author.privilege.ace) {
				quizzarray = datas[2][1];
				privilege = 'ace';
			}
		}
		const quizztitle = quizzarray.map(row => row[0]);

		// function to give the asked guide
		async function checkQuizz() {

			let quizz = 'nothing';

			if (!args.length) {
				quizz = quizzarray[0];
				quizzCommand.players[0].push(message.author);
				quizzCommand.players[1].push(0);
				quizzCommand.style = 'simple';
			}
			else if (args[0] === 'list') {
				const quizzlist = [];
				for (let i = 1; i < quizzarray.length; i++) {
					custom.number = i;
					custom.title = quizzarray[i][0];
					custom.summary = quizzarray[i][1];
					quizzlist.push(tongue.says(message, chapterTitle, 'makelist', custom).replace('\n', ''));
				}
				custom.privilege = privilege;
				custom.quizzList = quizzlist.join('\n');
				message.channel.send(tongue.says(message, chapterTitle, 'listall'));
				tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'list', custom));
				const totalAnswer = await tell.askUser(message, 60);
				const answer = totalAnswer.slice(0, totalAnswer.indexOf(' '));
				if (!isNaN(parseInt(answer)) && parseInt(answer) > 0 && parseInt(answer) <= quizzarray.length - 1) {
					quizz = quizzarray[parseInt(answer)];
				}
				else if (isNaN(Number(answer)) && quizztitle.includes(answer)) {
					quizz = quizzarray[quizztitle.indexOf(answer)];
				}
			}
			else {
				quizz = args.shift();
				if (!isNaN(Number(quizz)) && parseInt(quizz) > 0 && parseInt(quizz) <= quizzarray.length - 1) {
					quizz = quizzarray[parseInt(quizz)];
				}
				else if (isNaN(Number(quizz)) && quizztitle.includes(quizz)) {
					quizz = quizzarray[quizztitle.indexOf(quizz)];
				}
			}
			return quizz;
		}

		const quizz = await checkQuizz();

		if (quizz === 'nothing') return message.channel.send(tongue.says(message, chapterTitle, 'noquizzasked'));
		if (!quizzarray.includes(quizz)) return message.channel.send(tongue.says(message, chapterTitle, 'wrongquizz'));

		// building the request for the GoogleDoc API
		const quizzrequest = {
			documentId:`${quizz[2]}`,
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		async function collectQuizz() {
			const response = await gsheetlink.translateDoc(quizzrequest);
			return response;
		}

		const quizzcontent = await collectQuizz();

		async function playIndividualQuizz(playingQuizz) {
			if (message.author.quizz) {
				custom.title = message.author.quizz.title;
				return message.channel.send(tongue.says(message, chapterTitle, 'alreadyreading', custom));
			}
			let nodm = false;
			message.author.points = 0;
			let title = playingQuizz.doc.title;
			if (playingQuizz.title) title = playingQuizz.title;
			custom.title = title;
			custom.summary = '';
			if (playingQuizz.summary) custom.summary = playingQuizz.summary;
			if (playingQuizz.authors) {
				custom.authors = playingQuizz.authors;
			}
			else {
				custom.authors = tongue.says(message, chapterTitle, 'noauthors');
			}
			await message.author.send(tongue.says(message, chapterTitle, 'quizzbegin', custom))
				.then(() => {
					if (message.channel.type === 'DM') return;
					message.channel.send(tongue.says(message, chapterTitle, 'quizzsent', custom));
				})
				.catch(error => {
					nodm = true;
					custom.error = error;
					message.channel.send(tongue.says(message, chapterTitle, 'problemdm', custom));
					message.channel.send(tongue.says(message, chapterTitle, 'quizzbegin', custom));
				});
			let play = await tell.askUser(message, 45, !nodm);
			if (play === undefined) play = 'quit';
			if (play.toLowerCase().includes('yes') || play.toLowerCase().includes('y')) {
				message.author.quizz = true;
				message.author.quizz.title = title;
				let paragraph = playingQuizz.chapter.entries().next().value[0];
				let end = false;
				let result = '';
				playingQuizz.user.attributes.actual.question = true;
				playingQuizz.user.attributes.actual.answer = false;
				while (!end) {
					const chapter = playingQuizz.chapter.get(paragraph);
					const chaptertitle = chapter.title;
					let summary = '';
					let storytelling = '';
					const commands = new Map();
					let commandsText = '';
					let question = false;
					let action = '';
					let move = '';
					const reactcommands = [];
					chapter.attribute.forEach(att => {
						if (att.name.includes('question')) question = true;
						if (playingQuizz.attributes) att.check(att.name, playingQuizz.user.attributes.actual);
						if (att.true) {
							if (att.content.text) storytelling += att.content.text;
							if (att.content.summary) summary += att.content.summary;
							if (att.content.commands) {
								att.content.commands.forEach((value, key) => {
									commands.set(key, value);
									custom.text = value[0];
									custom.move = key;
									if (emojiUnicode.test(value[1])) {
										custom.action = `${tongue.says(message, chapterTitle, 'react').replace('\n', '')}`;
										action = 'react';
										reactcommands.push(value[1]);
										commandsText += tongue.says(message, chapterTitle, 'chaptercommandreact', custom);
									}
									else if ((value[1].length > 12) && (!isNaN(Number(value[1])))) {
										custom.action = `${tongue.says(message, chapterTitle, 'react').replace('\n', '')}`;
										action = 'react';
										const commandEmoji = message.client.emojis.cache.get(value[1]);
										custom.move = `${commandEmoji}`;
										reactcommands.push(value[1]);
										commandsText += tongue.says(message, chapterTitle, 'chaptercommandreact', custom);
									}
									else {
										custom.action = `${tongue.says(message, chapterTitle, 'write').replace('\n', '')}`;
										action = 'write';
										if (!(value[0].toLowerCase() === 'secret' || value[1].toLowerCase() === 'end')) commandsText += tongue.says(message, chapterTitle, 'chaptercommand', custom);
									}
								});
							}
						}
					});
					playingQuizz.user.way.push([[chapter.title], [summary]]);
					custom.chaptertitle = tongue.translate(chaptertitle, custom);
					custom.chapter = tongue.translate(storytelling, custom);
					custom.chapterCommands = tongue.translate(commandsText, custom);
					if (commands.has('end')) {
						await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'quizz', custom), !nodm);
						const endText = commands.get('end');
						end = true;
						result += `${endText[0]}\n`;
					}
					else {
						if (action === 'react') {
							const botMessage = await tongue.says(message, chapterTitle, 'quizz', custom);
							move = await tongue.reactUser(message, botMessage, reactcommands, 60, !nodm);
							console.log(move);
							if (typeof move === String) {
								if (move.includes('quit') || move.includes('stop')) {
									move = 'quit';
								}
								else if (reactcommands.includes(move.id)) {
									move = move.id;
								}
							}
							else if (reactcommands.includes(move.name)) {
								move = move.name;
							}
						}
						else {
							await tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'quizz', custom), !nodm);
							move = await tell.askUser(message, 60, !nodm);
						}
						if (move === undefined) move = 'quit';
						move = Diacritics.clean(move).toLowerCase();
						while (!commands.has(move)) {
							if (move === 'quit' || move === 'stop') return 'quit';
							message.author.send(tongue.says(message, chapterTitle, 'wrongcommand', custom));
							move = await tell.askUser(message, 3600, true);
							move = Diacritics.clean(move).toLowerCase();
						}
						const command = commands.get(move);
						if (question) {
							if (playingQuizz.user.attributes.actual.question) {
								custom.answer = tongue.translate(command[3], custom);
								message.author.points += Number(command[4]);
								playingQuizz.user.attributes.actual.question = !playingQuizz.user.attributes.actual.question;
								playingQuizz.user.attributes.actual.answer = !playingQuizz.user.attributes.actual.answer;
							}
							else {
								paragraph = command[2];
								playingQuizz.user.attributes.actual.question = !playingQuizz.user.attributes.actual.question;
								playingQuizz.user.attributes.actual.answer = !playingQuizz.user.attributes.actual.answer;
							}
						}
						else {
							paragraph = command[2];
						}
					}
					question = false;
				}
				return result;
			}
			else {
				return 'quit';
			}
		}

		// individual quizz
		playIndividualQuizz(quizzcontent).then(result => {
			custom.result = result;
			custom.points = message.author.points;
			if (result === 'quit') {
				initialchannel.send(tongue.says(message, chapterTitle, 'quitted', custom));
			}
			else {
				initialchannel.send(tongue.says(message, chapterTitle, 'quizzend', custom));
			}
			message.author.quizz = false;
			message.author.quizz.title = '';
		});
	},
};
