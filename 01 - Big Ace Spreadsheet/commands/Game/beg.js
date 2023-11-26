// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../../modules/tongue.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const start = require('./start');

const chapterTitle = 'beg';
const gameChapterTitle = start.gameActionChapterTitle;
const startChapterTitle = start.chapterTitle;

const custom = {};
let minimalAmount;
let maximalAmount;

module.exports = {
	name: 'beg',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 300,
	premiumCooldown: 5,
	aliases: ['beggar'],
	usage: tongue.says('', chapterTitle, 'usage', custom),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'public',
	guildOnly: true,

	async initialize(items) {
		// store the amounts from the config file
		minimalAmount = items.play.beg.min;
		maximalAmount = items.play.beg.max;
		custom.maximal = maximalAmount;
		// update the help of the command
		this.usage = tongue.says('', chapterTitle, 'usage', custom);

		return 'Minimal and maximal amounts loaded';
	},

	async execute(message) {
		// if the player is not registered, tell to type start to begin
		if (!start.playerIds.includes(message.author.id)) return message.channel.send(tongue.says(message, startChapterTitle, 'notregistered'));

		// define the amount of the gains
		const goldGain = Math.floor(Math.random() * (maximalAmount - minimalAmount) + minimalAmount);
		// update cash
		message.author.attributes.cash += goldGain;
		const resources = { cash : message.author.attributes.cash };
		// update cash in the spreadsheet
		await start.update(message.author.id, resources);
		// display the result of the action
		custom.gain = goldGain;
		custom.totalcash = message.author.attributes.cash;
		custom.addAction = tongue.says(message, chapterTitle, 'beggar');
		return message.channel.send(tongue.says(message, gameChapterTitle, 'cashgain', custom));
	},
};
