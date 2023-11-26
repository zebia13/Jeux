// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../modules/tongue.js');
const tell = require ('../modules/tell.js');

const chapterTitle = 'guide';
const locationTitle = 'location';

let spreadsheet;
let privilegeList;

module.exports = {
	name: 'guide',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 60,
	aliases: ['gd'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help : true,
	core : true,
	privacy: 'public',

	async initialize(items) {
		if (items.spreadsheets.guides.length > 20) {
			spreadsheet = items.spreadsheets.guides;
		}
		else {
			this.help = false;
		}
		privilegeList = items.arrays.privilegeCategory;
		return 'guide data loaded';
	},

	async execute(message, args) {

		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId:spreadsheet,
			range:'guides!A2:D',
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		// The guides array is created with 3 parts, public, premium and ace
		// The format is guidesarray[0] for public, [0][1] for guide table and [0][2] for the list of the titles
		async function collectDatas() {
			const response = await gsheetlink.collectDatas(sheetrequest);
			// change the arrays to fit something more transposable
			const guidesMap = new Map();
			for (const row of response) {
				privilegeList.forEach(privilege => {
					if ((message.channel.type === 'DM' && message.author.privilege[privilege]) || (message.channel.type !== 'DM' && (message.author.privilege[privilege] || message.guild.privilege[privilege]))) {
						if (row[3].includes(privilege)) {
							guidesMap.set(row[0], [row[0], row[1], row[2]]);
						}
					}
				});
			}
			return guidesMap;
		}

		// the datas are an array with the spreadsheet cells content
		const guides = await collectDatas();

		async function checkGuide() {

			let guide = 'nothing';

			if (!args.length) {
				const guidelist = [];
				let i = 1;
				guides.forEach((value, key) => {
					const custom = {
						number : i,
						title : key,
						summary : value[1],
					};
					guidelist.push(tongue.says(message, chapterTitle, 'makelist', custom).replace('\n', ''));
					i++;
				});

				const privilegeArray = [];
				let privilegeReturn = '';

				for (const privilege in message.author.privilege) {
					if (privilege) {
						privilegeArray.push(privilege);
					}
				}

				if (privilegeArray.length > 1) {
					const lastPrivilege = privilegeArray.pop();
					while (privilegeArray.length) {
						const privilegeShifted = privilegeArray.shift();
						privilegeReturn = `${privilegeReturn}${privilegeShifted}`;
						if (privilegeArray.length) privilegeReturn = `${privilegeReturn}, `;
					}
					privilegeReturn = `${privilegeReturn} ${tongue.says(message, locationTitle, 'and')} ${lastPrivilege}`;
				}

				const custom = {
					privilege : privilegeReturn,
					guideList : guidelist.join('\n'),
				};
				message.channel.send(tongue.says(message, chapterTitle, 'listall'));
				tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'list', custom));
				let answer;
				try {
					answer = await tell.askUser(message, 60);
				}
				catch(e) {
					answer = 'quit';
				}

				if (!isNaN(parseInt(answer)) && parseInt(answer) > 0 && parseInt(answer) <= guides.size) {
					const keys = Array.from(guides.keys());
					guide = guides.get(keys[parseInt(answer) - 1]);
				}
				else if (isNaN(Number(answer)) && guides.has(answer)) {
					guide = guides.get(answer);
				}
			}
			else {
				guide = args.shift();
				if (!isNaN(Number(guide)) && parseInt(guide) > 0 && parseInt(guide) <= guides.size) {
					const keys = Array.from(guides.keys());
					guide = guides.get(keys[parseInt(guide) - 1]);
				}
				else if (isNaN(Number(guide)) && guides.has(guide)) {
					guide = guides.get(guide);
				}
			}
			return guide;
		}

		const guide = await checkGuide();

		if (guide === 'nothing') return message.channel.send(tongue.says(message, chapterTitle, 'noguideasked'));

		if (typeof guide !== 'object') return message.channel.send(tongue.says(message, chapterTitle, 'wrongguide'));

		// building the request for the GoogleDoc API
		const guiderequest = {
			documentId:`${guide[2]}`,
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		async function collectGuide() {
			const response = await gsheetlink.translateDoc(guiderequest);
			return response;
		}

		const guidecontent = await collectGuide();

		const result = await tell.play(message, guidecontent, true);

		if (result.content) message.channel.send(result.content);
		if (message.author.play) delete message.author.play;
	},
};
