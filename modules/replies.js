// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('./api-gsheet.js');

let languageSheetrequestId;
const sheetRequest = {};
let footers;
const language = {};
let languageSheetTitle;
let footerSheetTitle;
let permissionSheetTitle;

// the datas are an array with the spreadsheet cells content
async function load(loadsheetrequest) {
	const element = await gsheetlink.collectDatas(loadsheetrequest);
	delete loadsheetrequest.range;
	return element;
}

// function to initialize the language module, it exports the languages files, the footers and the permission to write new elements
async function initialize(items) {
	// load the ID of the replies spreadsheet
	languageSheetrequestId = items.spreadsheets.languagespreadsheet;
	// get the index of the language sheet of the bot
	const languageRequest = {
		spreadsheetId : languageSheetrequestId,
		range : 'index!A2:C',
	};
	const langSheet = await gsheetlink.collectDatas(languageRequest);
	// get the name of the different sheets from the language spreadsheet : languages, footers, permissions
	const lName = langSheet.map(row => row[0]);
	const lTitle = langSheet.map(row => row[1]);
	languageSheetTitle = lTitle[lName.indexOf('languages')];
	footerSheetTitle = lTitle[lName.indexOf('footers')];
	permissionSheetTitle = lTitle[lName.indexOf('permissions')];
	// load the different languages of the bot
	sheetRequest.spreadsheetId = `${languageSheetrequestId}`;
	sheetRequest.range = `${languageSheetTitle}!A2:C`;
	const languageIndex = await load(sheetRequest);
	// create the language object with all the replies of all the languages
	for (const lang of languageIndex) {
		const docRequest = {
			documentId:`${lang[2]}`,
		};
		const languageLoad = await gsheetlink.translateDoc(docRequest, 'discord');
		if (language[lang[0]]) {
			let chapters;
			if (lang[3]) {
				chapters = language[lang[0]].chapter;
				language[lang[0]] = languageLoad;
			}
			else {
				chapters = languageLoad.chapter;
			}
			chapters.forEach((value, key) => {
				if (language[lang[0]].chapter.has(key)) {
					const chap = language[lang[0]].chapter.get(key);
					value.attributes.forEach((val, k) => {
						if (chap.attributes.has(k) && k !== 'main') console.log(`error in ${lang[1]} with chapter ${key}, attribute ${k}`);
						chap.attributes.set(k, val);
					});
				}
				else {
					language[lang[0]].chapter.set(key, value);
				}
			});
		}
		else {
			language[lang[0]] = languageLoad;
		}
		if (language[lang[0]].chapter.has('footers')) {
			let foots = language[lang[0]].chapter.get('footers');
			foots = foots.attributes.entries().next().value[1].content.text.split('\n');
			language[lang[0]].footers = [];
			let textRow = '';
			foots.forEach(row => {
				if (row === '') {
					language[lang[0]].footers.push(textRow);
					textRow = '';
				}
				if (textRow) {
					textRow += `\n${row}`;
				}
				else {
					textRow += `${row}`;
				}
			});
		}
	}
	// load the footers for embed messages
	sheetRequest.range = `${footerSheetTitle}!A1:B`;
	footers = await load(sheetRequest);
	// load the permission for the language
	sheetRequest.range = `${permissionSheetTitle}!A1:B`;
	const permission = await load(sheetRequest);
	exports.footers = footers;
	exports.permission = permission;
	exports.language = language;
	return 'all replies are loaded';
}

exports.initialize = initialize;
