const render = require('./render.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'nemesis';

let nemesisData;
let letterarray;


module.exports = {
	name: 'nemesis',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 10,
	aliases: ['kingpin', 'nm', 'kp', 'tf'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help:true,
	social: false,
	idlemafia: true,
	privacy: 'premium',

	async initialize(items) {
		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId : items.spreadsheets.spreadsheet,
			range:'bossdamage!A2:B401',
		};

		letterarray = items.arrays.letterarray;

		// collectDatas is the function to collect the data from the google spreadsheet
		nemesisData = await gsheetlink.collectDatas(sheetrequest);
		return 'nemesis data loaded';
	},

	execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		let basenumber = args.shift();
		basenumber = basenumber.replace(',', '.');

		// check if the data provided are in a proper format
		if (isNaN(parseFloat(basenumber)))return message.channel.send(tongue.says(message, chapterTitle, 'nonumber'));

		// recognize if its damages or vials
		let commandwish;

		if (basenumber.length === parseInt(basenumber).toString().length && parseInt(basenumber) < 400) {
			commandwish = 'vials';
		}
		else {
			commandwish = 'damages';
		}

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(commandwish === 'damages' && parseFloat(basenumber).toString().length !== basenumber.length) {
			args.unshift(basenumber.slice(parseFloat(basenumber).toString().length - basenumber.length));
			basenumber = basenumber.slice(0, parseFloat(basenumber).toString().length);
		}

		let lettertonumber;
		if (!args.length) {
			lettertonumber = '';
		}
		else{
			lettertonumber = args.shift();
		}

		if (lettertonumber.length === 1) lettertonumber = lettertonumber.toLowerCase();
		if (commandwish === 'damages' && !letterarray.includes(lettertonumber)) return message.channel.send(tongue.says(message, chapterTitle, 'wrongnumber'));

		// at this point there are three variables :
		//		commandwish, that admit vials or damages
		//		basenumber, which is the base number with possible decimal, but without any letter
		//		lettertonumber, which is the possible letter after the base number

		// the datas are an array with the spreadsheet cells content

		if (commandwish === 'vials') {
			let vials = nemesisData[parseInt(basenumber) - 1][1];
			let vialsup = nemesisData[parseInt(basenumber)][1];
			vials = render.toletter(vials);
			vialsup = render.toletter(vialsup);
			const custom = {
				basenumber : basenumber,
				vials : vials,
				vialsup : vialsup,
			};
			return message.channel.send(tongue.says(message, chapterTitle, 'vials', custom));
		}
		if (commandwish === 'damages') {
			const damages = parseFloat(render.tonumber(basenumber, lettertonumber));
			let blooddamages;
			const minimaldamage = render.toletter(nemesisData[0][1]);
			if (lettertonumber.length === 1) lettertonumber = lettertonumber.toUpperCase();
			const damagedone = `${basenumber}${lettertonumber}`;
			const custom = { minimaldamage : minimaldamage };
			if (damages < nemesisData[0][1]) return message.channel.send(tongue.says(message, chapterTitle, 'lowdamage', custom));
			for (let i = 1; i < nemesisData.length; i++) {
				if(damages < nemesisData[i][1]) {
					blooddamages = nemesisData[i - 1][0];
					custom.damagedone = damagedone;
					custom.blooddamages = blooddamages;
					return message.channel.send(tongue.says(message, chapterTitle, 'damages', custom));
				}
			}
		}
	},
};
