// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'ub';

let ubrankarray;
let spreadsheet;

module.exports = {
	name: 'ub',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 10,
	aliases: ['unfinishedbusiness'],
	usage: tongue.says('', chapterTitle, 'description'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'public',

	async initialize(items) {
		spreadsheet = items.spreadsheets.spreadsheet;
		// building the request for the GoogleSheet API
		const ubarraysheetrequest = {
			spreadsheetId : spreadsheet,
			range : 'ub!F1:G',
		};

		const ubarray = await gsheetlink.collectDatas(ubarraysheetrequest);
		ubrankarray = ubarray.map(row => Number(row[1]));
		return 'unfinished business data loaded';
	},

	async execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'norank'));
		let rank = parseInt(args.shift());
		if (isNaN(rank)) return message.channel.send(tongue.says(message, chapterTitle, 'wrongrank'));

		if (!ubrankarray.includes(rank)) {
			if (rank > ubrankarray[ubrankarray.length - 1]) {
				const custom = { maximalrank : ubrankarray[ubrankarray.length - 1] };
				return message.channel.send (tongue.says(message, chapterTitle, 'ranktoohigh', custom));
			}
			else if (rank < ubrankarray[0]) {
				const custom = { minimalrank : ubrankarray[0] };
				return message.channel.send (tongue.says(message, chapterTitle, 'ranktoolow', custom));
			}
			else{
				const custom = { rank : rank };
				message.channel.send (tongue.says(message, chapterTitle, 'notatrank', custom));
				rank = rank - 1;
			}
		}
		// searchsheet is the base range to find the specified ub, 4 is the beginning of UB datas in the sheet and 13 is the number of rows for each rank
		const searchsheet = 4 + ubrankarray.indexOf(rank) * 13;

		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId : spreadsheet,
			range:'ub!A' + searchsheet + ':D' + (parseInt(searchsheet) + 12),
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		async function collectDatas() {
			const response = await gsheetlink.collectDatas(sheetrequest);
			return response;
		}

		// the datas are an array with the spreadsheet cells content
		collectDatas().then(datas=>{
			let ubdata = '';
			for (let i = 2; i < datas.length; i++) {
				ubdata += `${datas[i][0]} : **${datas[i][1]}**`;
				ubdata += ` *${datas[i][2]}*\n`;
			}

			let bonus;
			let penalty;
			if (datas[1][1] === 'Italian') bonus = ':flag_it:';
			if (datas[1][3] === 'Italian') penalty = ':flag_it:';
			if (datas[1][1] === 'Mexican') bonus = ':flag_mx:';
			if (datas[1][3] === 'Mexican') penalty = ':flag_mx:';
			if (datas[1][1] === 'Japanese') bonus = ':flag_jp:';
			if (datas[1][3] === 'Japanese') penalty = ':flag_jp:';

			const custom = {
				bonus : bonus,
				penalty : penalty,
				ubdata : ubdata,
				rank : datas[0][1],
				name : datas[0][3],
				picture : datas[0][2],
			};
			return message.channel.send(tongue.says(message, chapterTitle, 'datas', custom));
		});

	},
};
