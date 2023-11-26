// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
let spreadsheet;
let basssayspreadsheet;
let catcommandsrequest;
let permissionsheetrequest;
let capobasesheetrequest;

async function initialize(items) {
	spreadsheet = items.spreadsheets.spreadsheet;
	basssayspreadsheet = items.spreadsheets.languagespreadsheet;
	catcommandsrequest = {
		spreadsheetId:`${basssayspreadsheet}`,
		range:'cat-commands!A2:C',
	};

	permissionsheetrequest = {
		spreadsheetId:`${basssayspreadsheet}`,
		range:'permission!A1:B',
	};

	capobasesheetrequest = {
		spreadsheetId:`${spreadsheet}`,
		range:'capobaselist!A2:L',
	};
	const permission = await permissionload();
	const capoemoji = await getEmoji();
	const catcommands = await catcommandsload();
	exports.capoemoji = capoemoji;
	exports.permission = permission;
	exports.catcommands = catcommands;
	return 'all replies are loaded';
}

exports.initialize = initialize;

// the datas are an array with the spreadsheet cells content
async function permissionload() {
	const permission = await gsheetlink.collectDatas(permissionsheetrequest);
	return permission;
}

// the datas are an array with the spreadsheet cells content
async function catcommandsload() {
	const catcommandssheet = await gsheetlink.collectDatas(catcommandsrequest);
	const catcommands = [[], [], [], []];
	catcommandssheet.forEach(command => {
		if (command[2].toLowerCase() === 'cat') {
			catcommands[0].push(command[0].toLowerCase());
			catcommands[1].push(command[1]);
		}
		else if (command[2].toLowerCase() === 'player') {
			catcommands[2].push(command[0].toLowerCase());
			catcommands[3].push(command[1]);
		}
	});
	// the catcommands array is build with first and second column : cat commands, and third and fourth columns : player columns
	return catcommands;
}

async function collectbasecapodatas() {
	const response = await gsheetlink.collectDatas(capobasesheetrequest);
	return response;
}

async function getEmoji() {
	const capobaseinfo = await collectbasecapodatas();
	const caposurnamelist = capobaseinfo.map (row => row[0]);
	const capoemojiid = capobaseinfo.map(row => row[11]);
	const capoimagelink = capobaseinfo.map(row => row[10]);
	const capolist = [caposurnamelist, capoemojiid, capoimagelink];
	return capolist;
}
