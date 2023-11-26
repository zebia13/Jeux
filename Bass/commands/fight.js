// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');
const capos = require ('../modules/bass-capo-object.js');

const chapterTitle = 'fight';
let premiumFightMaxLevel = '8-800';
let fightMaxLevel = '8-400';

const fight = {};

module.exports = {
	name: 'fight',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 10,
	aliases: ['cigarfight, fgt, cf'],
	usage: tongue.says('', chapterTitle, 'description'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'premium',

	async initialize(items) {
		await capos.initialize(items);

		// building the request for the GoogleSheet API
		const fightlevelarraysheetrequest = {
			spreadsheetId:`${items.spreadsheets.spreadsheet}`,
			range:'fights!A2:A',
		};
		const fightcompoarraysheetrequest = {
			spreadsheetId:`${items.spreadsheets.spreadsheet}`,
			range:'fights!B2:E',
		};

		const fightlevelarray = await gsheetlink.collectDatas(fightlevelarraysheetrequest);
		const fightcompoarray = await gsheetlink.collectDatas(fightcompoarraysheetrequest);
		// get all tle level referenced
		const fightlevel = fightlevelarray.map(row => row[0]);
		// delete blank cell from the array and fill with capo emojis
		let error = '';
		let i = 0;
		// translate the capo array in an array of capo emoji
		for (const line in fightcompoarray) {
			// each fight level can have several composition
			const newLine = [];
			for (const composition in fightcompoarray[line]) {
				const newComposition = [];
				if (fightcompoarray[line][composition] !== '') {
					// separate the composition with each capo
					const capoarray = fightcompoarray[line][composition].split(',');
					// for each capo search the emoji
					for (const capo in capoarray) {
						let capoemoji;
						try {
							// true to get the skin
							const emoji = await capos.getCapo(capoarray[capo], true);
							capoemoji = emoji.emoji;
						}
						// send an error if the capo is not referenced
						catch (e) {
							error += `${e} at line ${i}\n`;
							capoemoji = capoarray[capo];
						}
						// put the emoji in the composition
						newComposition.push(capoemoji);
					}
					// put the composition in the level
					newLine.push(newComposition);
				}
			}
			// fill the global fight level datas
			fightcompoarray[i] = newLine;
			i++;
		}
		// fill the fight object with data
		fight.composition = fightcompoarray;
		fight.levels = fightlevel;
		fight.minLevel = fightlevel.pop();
		fight.maxLevel = fightlevel[0];
		premiumFightMaxLevel = fightlevel[200];
		fightMaxLevel = fightlevel[600];
		// tell if there was a probleme in the capo composition
		let warning = '';
		if (error) {
			warning = `WARNING there was an error in capo compilation : ${error}`;
		}
		return `fight capo compositions done ${warning}`;
	},

	async execute(message, args) {

		// cap the max level for non Ace
		if (!message.author.privilege.ace) {
			if (message.guild) {
				if (!message.guild.privilege.ace) {
					if (!message.guild.privilege.premium) {
						fight.maxLevel = premiumFightMaxLevel;
					}
					else {
						fight.maxLevel = fightMaxLevel;
					}
				}
			}
			else if (!message.author.privilege.premium) {
				fight.maxLevel = premiumFightMaxLevel;
			}
			else {
				fight.maxLevel = fightMaxLevel;
			}
		}

		// return an error if there is no level specified
		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'nolevel'));

		// function if the level is not referenced
		function levelNotReferenced() {
			const custom = {
				minlevel : fight.minLevel,
				maxlevel : fight.maxLevel,
			};
			warning += tongue.says(message, chapterTitle, 'wronglevel', custom);
			custom.warning = warning;
			return tongue.says(message, chapterTitle, 'wrongresult', custom);
		}

		let warning = '';

		let rank = '8';
		let level;
		// create an array to have the user input
		const inputArray = [];
		// take the different args
		args.forEach(argument => {
			// replace all non numeric
			argument = argument.replace(/[^0-9]/g, '-');
			// search for an -
			if (argument.indexOf('-') > -1) {
				// make an array with different numbers inputed by the user
				argument = argument.split('-');
				argument.forEach(line => {
					if (line !== '') {
						inputArray.push(line);
					}
				});
			}
			// if there is only one argument fill the array with it
			else {
				inputArray.push(argument);
			}
		});

		// if the array is empty return an error
		if (inputArray.length === 0) {
			return message.channel.send(tongue.says(message, chapterTitle, 'nolevel'));
		}
		// if the user inputed only the fight level
		else if (inputArray.length === 1) {
			level = inputArray[0];
		}
		// create the rank and level if the player specify more than one number
		else {
			rank = inputArray[0];
			level = inputArray[1];
		}

		// cap the level if more than maxlevel for non Ace
		const custom = { maxlevel : fight.maxLevel };
		if (message.guild) {
			if (!(message.guild.privilege.ace || message.author.privilege.ace)) {
				if (Number(rank) > 8) {
					rank = '8';
					level = fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1);
					warning = tongue.says(message, chapterTitle, 'capedlevel', custom);
				}
				else if (Number(rank) === 8 && Number(level) > Number(fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1))) {
					level = fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1);
					warning = tongue.says(message, chapterTitle, 'capedlevel', custom);
				}
			}
		}
		else if (!message.author.privilege.ace) {
			if (Number(rank) > 8) {
				rank = '8';
				level = fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1);
				warning = tongue.says(message, chapterTitle, 'capedlevel', custom);
			}
			else if (Number(rank) === 8 && Number(level) > Number(fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1))) {
				level = fight.maxLevel.slice(fight.maxLevel.indexOf('-') + 1);
				warning = tongue.says(message, chapterTitle, 'capedlevel', custom);
			}
		}

		// check if the level is referenced
		if (!fight.levels.includes(`${rank}-${level}`)) {
			return message.channel.send(levelNotReferenced());
		}

		// search the capo lineup
		const capolineups = fight.composition[fight.levels.indexOf(`${rank}-${level}`)];
		custom.rank = rank;
		custom.level = level;
		custom.warning = warning;

		// display the lineup
		message.channel.send(tongue.says(message, chapterTitle, 'start', custom));
		for (const lineup in capolineups) {
			let capoemoji = '';
			for (const capoId in capolineups[lineup]) {
				let capo;
				try {
					capo = await message.client.emojis.cache.get(capolineups[lineup][capoId]);
				}
				catch (e) {
					capo = capolineups[lineup][capoId];
				}
				capoemoji += `${capo}`;
			}
			message.channel.send(capoemoji);
		}
		return message.channel.send(tongue.says(message, chapterTitle, 'end'));
	},
};
