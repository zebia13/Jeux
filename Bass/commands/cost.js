const render = require('./render.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'cost';
const locationTitle = 'location';

let spreadsheet;
let letterarray;
let locationArray;
let locationData;
let locationDataTitle;


module.exports = {
	name: 'cost',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['co', 'buildcost'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'premium',

	async initialize(items) {
		letterarray = items.arrays.letterarray;
		locationArray = items.arrays.locationarray;
		spreadsheet = items.spreadsheets.spreadsheet;

		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId : spreadsheet,
			range:'cost!A1:K',
		};

		locationData = await gsheetlink.collectDatas(sheetrequest);
		locationDataTitle = locationData.shift();

		return 'cost multiplier loaded';
	},


	execute(message, args) {

		if(!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));

		if (args[0].toLowerCase() === 'event') {
			args.shift();
			if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'wrongevent'));
		}

		const playerwish = args.shift().toLowerCase();
		let locateName;
		let locatecolumn;
		let locateExist = false;

		locationArray.forEach((location, i) => {
			if (location.includes(playerwish)) {
				locateName = locationArray[i][0];
				locatecolumn = locationDataTitle.indexOf(locateName);
				locateExist = true;
			}
		});

		if (!locateExist) {
			if (!isNaN(playerwish)) {
				args.unshift(playerwish);
				message.channel.send(tongue.says(message, chapterTitle, 'warninglocation'));
				locateName = 'street';
				locatecolumn = locationDataTitle.indexOf(locateName);
			}
			else {
				return message.channel.send(tongue.says(message, chapterTitle, 'wrongargument'));
			}
		}

		const locationdisplay = tongue.says(message, locationTitle, locateName);


		if (args.length < 2) return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));

		let firstbasenumber = args.shift();
		firstbasenumber = firstbasenumber.replace(',', '.');

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(parseFloat(firstbasenumber).toString().length !== firstbasenumber.length) {
			args.unshift(firstbasenumber.slice(parseFloat(firstbasenumber).toString().length - firstbasenumber.length));
			firstbasenumber = firstbasenumber.slice(0, parseFloat(firstbasenumber).toString().length);
		}

		let firstletter = '';
		let secondarg = args.shift();
		if (secondarg.length === 1) secondarg = secondarg.toLowerCase();
		if (letterarray.includes(secondarg)) firstletter = secondarg;

		let secondbasenumber;
		if (firstletter === '') {
			secondbasenumber = secondarg;
		}
		else {
			secondbasenumber = args.shift();
		}
		secondbasenumber = secondbasenumber.replace(',', '.');

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(parseFloat(secondbasenumber).toString().length !== secondbasenumber.length) {
			args.unshift(secondbasenumber.slice(parseFloat(secondbasenumber).toString().length - secondbasenumber.length));
			secondbasenumber = secondbasenumber.slice(0, parseFloat(secondbasenumber).toString().length);
		}

		let secondletter = '';
		secondarg = '';
		if (args.length) secondarg = args.shift();
		if (secondarg.length === 1) secondarg = secondarg.toLowerCase();
		if (letterarray.includes(secondarg)) secondletter = secondarg;

		// check if the datas provided are in a proper format
		if (isNaN(parseFloat(firstbasenumber)) || isNaN(parseFloat(secondbasenumber)) || !letterarray.includes(firstletter) || !letterarray.includes(secondletter)) {
			return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));
		}

		const firstnumber = render.tonumber(firstbasenumber, firstletter);
		const secondnumber = render.tonumber(secondbasenumber, secondletter);

		let levelupgrade;
		let costlevel;
		let levelupgradedisplay;
		let costleveldisplay;

		if (Number(firstnumber) > Number(secondnumber)) {
			levelupgrade = parseInt(secondnumber);
			levelupgradedisplay = secondbasenumber;
			costlevel = Number(firstnumber);
			if (firstletter.length === 1) firstletter = firstletter.toUpperCase();
			costleveldisplay = `${firstbasenumber}${firstletter}`;
		}
		else {
			levelupgrade = parseInt(firstnumber);
			levelupgradedisplay = firstbasenumber;
			costlevel = Number(secondnumber);
			if (secondletter.length === 1) secondletter = secondletter.toUpperCase();
			costleveldisplay = `${secondbasenumber}${secondletter}`;
		}

		// collectDatas is the function to collect the data from the google spreadsheet
		// the datas are an array with the spreadsheet cells content

		const costmultiplier = Number(locationData[0][locatecolumn]);

		const totalcost = render.toletter((costlevel * ((1 - Math.pow(costmultiplier, levelupgrade)) / (1 - costmultiplier))).toString());

		const custom = {
			totalcost : totalcost,
			location : locationdisplay,
			costlevel : costleveldisplay,
			levelupgrade : levelupgradedisplay,
		};

		return message.channel.send(tongue.says(message, chapterTitle, 'totalcost', custom));

	},
};
