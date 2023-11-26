// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../../modules/tongue.js');
const tell = require ('../../../modules/tell.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//													collectDatas that gives you specified datas from a spreadhseet
//													updateSheet that allows you to update a spreadsheet
//													updateValues that allows you to update values in a spreadsheet
//													appendValues that will add datas at the end of a spreadsheet
//													getDoc that will collect datas from a google document
const gsheetlink = require('../../../modules/api-gsheet.js');

const chapterTitle = 'start';
const gameActionChapterTitle = 'gameactions';

let playerIds;
let playSpreadsheet;
const playerSpreadsheet = {};

module.exports = {
	name: 'start',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['st'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'public',
	guildOnly: false,
	playerIds: [],
	familias : [],
	chapterTitle : chapterTitle,
	gameActionChapterTitle : gameActionChapterTitle,


	async initialize(items) {

		// load the players spreadsheet
		playSpreadsheet = items.spreadsheets.playmafiaspreadsheet;
		let playerspreadsheet = await gsheetlink.getSheet({ spreadsheetId : playSpreadsheet });
		playerSpreadsheet.sheetId = playerspreadsheet.sheets[0].properties.sheetId;
		playerSpreadsheet.title = playerspreadsheet.sheets[0].properties.title;

		// request to load players data
		const playersIdSheetRequest = {
			spreadsheetId : playSpreadsheet,
			range :`${playerSpreadsheet.title}!A2:M`,
		};

		// load the players data
		playerspreadsheet = await gsheetlink.collectDatas(playersIdSheetRequest);
		playerSpreadsheet.data = playerspreadsheet;
		// load the arrays of the commands with familias and players ID
		this.playerIds = playerSpreadsheet.data.map(row => row[0]);
		this.familias = playerSpreadsheet.data.map(row => row[3]);

		return 'Playing players ID and familia loaded';
	},

	// function start, launched when the bot loads
	async start(client) {
		for(let i = 0 ; i < this.playerIds.length ; i++) {
			const user = await client.users.fetch(this.playerIds[i]);
			const playerData = playerSpreadsheet.data[i];
			this.assignAttributes(user, playerData);
		}
		return console.log('users game datas loaded');
	},

	// function to assign the attributes to each player
	assignAttributes(user, playerData) {
		user.attributes.familia = playerData[3];
		user.attributes.cash = Number(playerData[4]);
		user.attributes.cigar = Number(playerData[5]);
	},

	async execute(message) {

		// check if there are players registered in the command
		if (this.playerIds) {
			// check if the user is already registered as a player
			if (this.playerIds.includes(message.author.id)) {
				// ask if the player wants to start again
				const custom = { familia : message.author.attributes.familia };
				const messageSend = await message.channel.send(tongue.says(message, chapterTitle, 'alreadyregistered', custom));
				let answer;
				try {
					answer = await tell.buttonUser(messageSend, 60, message.author);
				}
				catch(e) {
					answer = '';
				}
				// if the player wants to continue with the actual familila
				if (answer !== 'yes') {
					return message.channel.send(tongue.says(message, chapterTitle, 'continue'));
				}
				// if the player wants to start again
				else {
					// create the request to delete the player's line
					const deleteRequest = {
						spreadsheetId : playSpreadsheet,
					};
					const requests = [{
						'deleteDimension': {
							'range': {
								'sheetId': playerSpreadsheet.sheetId,
								'dimension': 'ROWS',
								'startIndex': Number(this.playerIds.indexOf(message.author.id)) + 2,
								'endIndex': Number(this.playerIds.indexOf(message.author.id)) + 3,
							},
						},
					}];
					// delete the player data
					deleteRequest.resource = { requests };
					// delete members from the list
					await gsheetlink.updateSheet(deleteRequest);
					const playerReference = this.playerIds.indexOf(message.author.id);
					this.playerIds.splice(playerReference, 1);
					this.familias.splice(playerReference, 1);
				}
			}
		}
		// ask the familia the player wants to have
		let familia = '';
		message.channel.send(tongue.says(message, chapterTitle, 'familia'));
		try {
			familia = await tell.askUser(message, 60);
		}
		catch(e) {
			familia = '';
		}
		// if no familia has been choosen
		if (familia === '') {
			return message.channel.send(tongue.says(message, chapterTitle, 'nofamilia'));
		}
		// if the familia's name is too long
		if (familia.length > 50) {
			return message.channel.send(tongue.says(message, chapterTitle, 'wrongfamilia'));
		}
		// if the familia already exists
		if (this.familias) {
			if (this.familias.includes(familia)) {
				const player = await message.client.users.fetch(playerIds[this.familias.indexOf(familia)]);
				const custom = { playerid : player.nickname };
				return message.channel.send(tongue.says(message, chapterTitle, 'alreadyfamilia', custom));
			}
		}
		// add the familia to the player attributes
		message.author.attributes.familia = familia;
		// add the data to the command data
		this.familias.push(familia);
		this.playerIds.push(message.author.id);
		// add the data to the player spreadsheet
		const values = [message.author.id, message.author.privilege.premium, 0, familia, 0, 0];
		const addPlayerRequest = {
			spreadsheetId : playSpreadsheet,
			valueInputOption : 'RAW',
			range : `${playerSpreadsheet.title}!A2:M`,
			insertDataOption : 'INSERT_ROWS',
			resource : {
				range : `${playerSpreadsheet.title}!A2:M`,
				values : [values],
			},
		};

		const custom = { familia : message.author.attributes.familia };
		gsheetlink.appendValues(addPlayerRequest);
		const user = message.author;
		// assign the attributes to the player
		this.assignAttributes(user, values);
		return message.channel.send(tongue.says(message, chapterTitle, 'newlegacy', custom));
	},

	// update function when a player make an action
	async update(playerId, resources) {
		// find the line reference of the player
		const line = this.playerIds.indexOf(playerId) + 2;
		// create the request
		const updatePlayerRequest = {
			spreadsheetId: playSpreadsheet,
			resource: {
				valueInputOption: 'RAW',
			},
		};
		const individualrequests = [];
		if (resources.cash) {
			individualrequests.push({
				range: `${playerSpreadsheet.title}!E${line}:E${line}`,
				values: [[resources.cash]],
			});
		}
		if (resources.cigar) {
			individualrequests.push({
				range: `${playerSpreadsheet.title}!F${line}:F${line}`,
				values: [[resources.cigar]],
			});
		}
		if (resources.bank) {
			individualrequests.push({
				range: `${playerSpreadsheet.title}!C${line}:C${line}`,
				values: [[resources.bank]],
			});
		}
		// update the player sheet and datas
		updatePlayerRequest.resource.data = individualrequests;
		await gsheetlink.updateValues(updatePlayerRequest);
	},
};
