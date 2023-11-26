// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../../modules/api-gsheet.js');

async function initialize(items) {

	const premiumrequest = {
		spreadsheetId: `${items.spreadsheets.premiumspreadsheet}`,
		range: 'premiumganglist!A2:E',
	};

	const premiumgang = await gsheetlink.collectDatas(premiumrequest);
	premiumgang.push(premiumgang.map(row => row[0]));

	exports.PremiumGuildsID = premiumgang;

	premiumrequest.range = 'premiumplayerslist!A2:E';

	const premiumplayers = await gsheetlink.collectDatas(premiumrequest);
	premiumplayers.push(premiumplayers.map(row => row[0]));

	exports.PremiumPlayersID = premiumplayers;

	const playrequest = {
		spreadsheetId: `${items.spreadsheets.playspreadsheet}`,
		range: 'datas!A2:G',
	};

	let players = await gsheetlink.collectDatas(playrequest);
	if (players) {
		players = players.map(row => row[0]);
	}

	exports.playersID = players;

	return 'premium gangs/players collected';
}

exports.initialize = initialize;
