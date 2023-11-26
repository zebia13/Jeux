// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../../modules/tongue.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const start = require('./start');

const chapterTitle = 'casino';
const gameChapterTitle = start.gameActionChapterTitle;
const startChapterTitle = start.chapterTitle;

const custom = {};
let minimalAmount;
let maximalAmount;
let slotMachine;

module.exports = {
	name: 'casino',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 60,
	premiumCooldown: 5,
	aliases: ['vegas'],
	usage: tongue.says('', chapterTitle, 'usage', custom),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'public',
	guildOnly: true,

	async initialize(items) {
		// store the amounts from the config file
		slotMachine = items.play.casino.slot;
		minimalAmount = items.play.casino.min;
		maximalAmount = items.play.casino.max;
		custom.maximal = maximalAmount;
		custom.minimal = -minimalAmount;
		// update the help of the command
		this.usage = tongue.says('', chapterTitle, 'usage', custom);

		return 'Chance, Minimal and maximal amounts loaded';
	},

	async execute(message, args) {
		// if the player is not registered, tell to type start to begin
		if (!start.playerIds.includes(message.author.id)) return message.channel.send(tongue.says(message, startChapterTitle, 'notregistered'));

		if (message.author.attributes.cash < 100) return message.channel.send(tongue.says(message, chapterTitle, 'notenoughcash'));

		if (!args.length) {
			// define the amount of the gains
			let goldGain = Math.floor(Math.random() * (maximalAmount - minimalAmount) + minimalAmount);
			if (goldGain === 0) goldGain = 1;
			// update cash
			message.author.attributes.cash += goldGain;
			const resources = { cash : message.author.attributes.cash };
			// update cash in the spreadsheet
			await start.update(message.author.id, resources);
			// display the result of the action
			custom.gain = Math.abs(goldGain);
			custom.totalcash = message.author.attributes.cash;
			custom.addAction = tongue.says(message, chapterTitle, 'casino');
			if (goldGain < 0) {
				return message.channel.send(tongue.says(message, gameChapterTitle, 'cashlose', custom));
			}
			else {
				return message.channel.send(tongue.says(message, gameChapterTitle, 'cashgain', custom));
			}
		}

		const game = args.shift();

		if (game.includes('slot')) {
			const addAction = `${tongue.says(message, chapterTitle, 'casino')}${tongue.says(message, chapterTitle, 'slotmachine')}`;
			let gain;
			let amount = 100;
			if (!args.length) {
				const inputAmount = Number(args.shift());
				if (!isNaN(inputAmount)) {
					if (inputAmount < 100) amount = 100;
					if (inputAmount > message.author.attributes.cash) amount = message.author.attributes.cash;
				}
			}
			const slotResult = Math.floor(Math.random() * 100);
			let gainMessage;
			if (slotResult <= slotMachine.big) {
				gain = amount * 10;
				gainMessage = tongue.says(message, chapterTitle, 'slotbig');
			}
			else if(slotResult <= slotMachine.average) {
				gain = amount * 4;
				gainMessage = tongue.says(message, chapterTitle, 'slotaverage');
			}
			else if(slotResult <= slotMachine.low) {
				gain = amount * 2;
				gainMessage = tongue.says(message, chapterTitle, 'slotlow');
			}
			else {
				gain = 0;
				gainMessage = tongue.says(message, chapterTitle, 'slotlose');
			}
			// update cash
			message.author.attributes.cash += gain - amount;
			const resources = { cash : message.author.attributes.cash };
			// update cash in the spreadsheet
			await start.update(message.author.id, resources);
			custom.gain = Math.abs(gain - amount);
			custom.totalcash = message.author.attributes.cash;
			custom.addAction = `${addAction}${gainMessage}`;
			if (gain - amount < 0) {
				return message.channel.send(tongue.says(message, gameChapterTitle, 'cashlose', custom));
			}
			else {
				return message.channel.send(tongue.says(message, gameChapterTitle, 'cashgain', custom));
			}

		}
	},
};
