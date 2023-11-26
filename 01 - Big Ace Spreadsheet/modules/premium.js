// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../../modules/api-gsheet.js');

async function initialize(items) {

	const premiumrequest = {
		spreadsheetId: `${items.spreadsheets.premiumspreadsheet}`,
		range: 'premiumganglist!A2:G',
	};

	const premiumgang = await gsheetlink.collectDatas(premiumrequest);
	premiumgang.push(premiumgang.map(row => row[0]));

	exports.PremiumGuildsID = premiumgang;

	premiumrequest.range = 'premiumplayerslist!A2:G';

	const premiumplayers = await gsheetlink.collectDatas(premiumrequest);
	premiumplayers.push(premiumplayers.map(row => row[0]));

	exports.PremiumPlayersID = premiumplayers;

	const playrequest = {
		spreadsheetId: `${items.spreadsheets.playmafiaspreadsheet}`,
		range: 'datas!A2:G',
	};

	let playersMafia = await gsheetlink.collectDatas(playrequest);
	playersMafia = playersMafia.map(row => row[0]);

	exports.playersMafiaID = playersMafia;

	return 'premium gangs/players and mafia players collected';
}

async function getRoleIds(guild, role) {
	console.log(guild);
	console.log(guild.roles.cache.has(role));
	const idArray = guild.roles.cache.get(role).members.map(m=>m.user.id);
	return idArray;
}

exports.getRoleIds = getRoleIds;
exports.initialize = initialize;
