// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'tips';

let spreadsheet;
let privilegeList;
let defaultLanguage;
const tips = {};

module.exports = {
	name: 'tips',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 600,
	aliases: ['tip', 'trick'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help : true,
	social: false,
	idlemafia: true,
	privacy: 'public',

	async initialize(items) {
		spreadsheet = items.spreadsheets.tipsspreadsheet;
		privilegeList = items.arrays.privilegeCategory;
		defaultLanguage = items.formating.defaultLanguage;
		const sheetrequest = {
			spreadsheetId:spreadsheet,
			range:'tips!A2:E',
		};
		const tipsSpreadsheet = await gsheetlink.collectDatas(sheetrequest);
		let languageArray = tipsSpreadsheet.map(row => row[4]);
		languageArray = new Set(languageArray);
		languageArray = [...languageArray];
		languageArray.forEach(language => {
			tips[language] = {};
			privilegeList.forEach(privilege => {
				tips[language][privilege] = { total : new Map() };
			});
		});
		for (let i = 0; i < tipsSpreadsheet.length ; i++) {
			const tip = await gsheetlink.translateDoc({ documentId : `${tipsSpreadsheet[i][2]}` });
			let privilegeTipArray = [tipsSpreadsheet[i][3]];
			if (tipsSpreadsheet[i][3].includes(',')) {
				privilegeTipArray = tipsSpreadsheet[i][3].split(',');
			}
			privilegeTipArray.forEach(privilege => {
				tips[tipsSpreadsheet[i][4]][privilege][tipsSpreadsheet[i][0]] = tip;
				if (!tips[tipsSpreadsheet[i][4]][privilege].total.chapter) {
					tips[tipsSpreadsheet[i][4]][privilege].total = tip;
				}
				else {
					tip.chapter.forEach((value, key) => {
						tips[tipsSpreadsheet[i][4]][privilege].total.chapter.set(key, value);
					});
				}
			});
		}
		return 'tips data loaded';
	},

	async execute(message, args) {

		let language;
		if (tongue.defaultLanguage) {
			defaultLanguage = tongue.defaultLanguage;
		}
		language = defaultLanguage;
		if (message.author.language !== 'default') language = message.author.language;

		let tip = tips[language];
		let tipConcat;

		if (args.length) {
			const tipsAsked = args.shift();
			let fill = false;
			privilegeList.forEach(privilege => {
				if ((message.channel.type === 'DM' && message.author.privilege[privilege]) || (message.channel.type !== 'DM' && (message.author.privilege[privilege] || message.guild.privilege[privilege]))) {
					if (tip[privilege][tipsAsked] && !fill) {
						tipConcat = tip[privilege].tipsAksed;
						fill = true;
					}
					else if(tip[privilege][tipsAsked] && fill) {
						tip[privilege][tipsAsked].chapter.forEach((value, key) => {
							tipConcat.chapter.set(key, value);
						});
					}
				}
			});
			if (tipConcat) {
				tip = tipConcat;
			}
			else {
				let possibleAsk = [];
				privilegeList.forEach(privilege => {
					if ((message.channel.type === 'DM' && message.author.privilege[privilege]) || (message.channel.type !== 'DM' && (message.author.privilege[privilege] || message.guild.privilege[privilege]))) {
						for (const key in tip[privilege]) {
							if (key !== 'total') possibleAsk.push(key);
						}
					}
				});
				possibleAsk = new Set(possibleAsk);
				possibleAsk = [...possibleAsk];
				let sentence = '';
				possibleAsk.forEach(ask => {
					sentence = `${sentence}, ${ask}`;
				});
				const custom = {
					possibleAsk : sentence,
					asked : tipsAsked,
				};
				return message.channel.send(tongue.says(message, chapterTitle, 'notipreference', custom));
			}
		}

		if (!tipConcat) {
			let fill = false;
			privilegeList.forEach(privilege => {
				if ((message.channel.type === 'DM' && message.author.privilege[privilege]) || (message.channel.type !== 'DM' && (message.author.privilege[privilege] || message.guild.privilege[privilege]))) {
					if (!fill) {
						tipConcat = tip[privilege].total;
						fill = true;
					}
					else if (tip[privilege].total.size) {
						tip[privilege].total.chapter.forEach((value, key) => {
							tipConcat.chapter.set(key, value);
						});
					}
				}
			});
			tip = tipConcat;
		}

		const randomTip = Math.floor(Math.random() * tip.chapter.size);
		const tipKeys = Array.from(tip.chapter.keys());

		const chapter = tip.chapter.get(tipKeys[randomTip]);

		let tiptelling = '';
		// check the attributes of the chapter
		chapter.attributes.forEach(att => {
			if (att.content.text) tiptelling += att.content.text;
		});

		const custom = { tip : tiptelling };

		return message.channel.send(tongue.says(message, chapterTitle, 'tip', custom));

	},
};
