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

const chapterTitle = 'story';
const locationTitle = 'location';

let spreadsheet;
let privilegeList;
let testStory = '';

module.exports = {
	name: 'story',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 10,
	aliases: ['sis', 'adventure', 'ad'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help : true,
	core : true,
	privacy: 'public',

	async initialize(items) {
		if (items.spreadsheets.stories.length > 20) {
			spreadsheet = items.spreadsheets.stories;
		}
		else {
			this.help = false;
		}
		if (items.docs) {
			if (items.docs.teststory) {
				testStory = items.docs.teststory;
			}
		}
		privilegeList = items.arrays.privilegeCategory;
		return 'story data loaded';
	},

	async execute(message, args) {

		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId:spreadsheet,
			range:'stories!A2:F',
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		async function collectDatas() {
			const response = await gsheetlink.collectDatas(sheetrequest);
			// change the arrays to fit something more transposable
			const storiesMap = new Map();
			for (const row of response) {
				privilegeList.forEach(privilege => {
					if ((message.channel.type === 'DM' && message.author.privilege[privilege]) || (message.channel.type !== 'DM' && (message.author.privilege[privilege] || message.guild.privilege[privilege]))) {
						if (row[5].includes(privilege)) {
							storiesMap.set(row[0], [row[0], `${row[1]}\n     ${row[2]}`, row[4]]);
						}
					}
				});
			}
			return storiesMap;
		}

		// the datas are an array with the spreadsheet cells content
		const stories = await collectDatas();

		async function checkStory() {

			let story = 'nothing';

			if (!args.length) {
				const storylist = [];
				let i = 1;
				stories.forEach((value, key) => {
					const custom = {
						number : i,
						title : key,
						summary : value[1],
					};
					storylist.push(tongue.says(message, chapterTitle, 'makelist', custom).replace('\n', ''));
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
					storyList : storylist.join('\n'),
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

				if (!isNaN(parseInt(answer)) && parseInt(answer) > 0 && parseInt(answer) <= stories.size) {
					const keys = Array.from(stories.keys());
					story = stories.get(keys[parseInt(answer) - 1]);
				}
				else if (isNaN(Number(answer)) && stories.has(answer)) {
					story = stories.get(answer);
				}
			}
			else {
				story = args.shift();
				if (!isNaN(Number(story)) && parseInt(story) > 0 && parseInt(story) <= stories.size) {
					const keys = Array.from(stories.keys());
					story = stories.get(keys[parseInt(story) - 1]);
				}
				else if (isNaN(Number(story)) && (stories.has(story) || story === 'test')) {
					if (testStory !== '') {
						stories.set('test', ['test', 'just testing purpose', testStory]);
					}
					story = stories.get(story);
				}
			}
			return story;
		}

		const story = await checkStory();

		if (story === 'nothing') return message.channel.send(tongue.says(message, chapterTitle, 'nostoryasked'));

		if (typeof story !== 'object') return message.channel.send(tongue.says(message, chapterTitle, 'wrongstory'));

		// building the request for the GoogleDoc API
		const storyrequest = {
			documentId:`${story[2]}`,
		};

		// collectDatas is the function to collect the data from the google spreadsheet
		async function collectStory() {
			const response = await gsheetlink.translateDoc(storyrequest);
			return response;
		}

		const storycontent = await collectStory();

		const result = await tell.play(message, storycontent, true);

		message.channel.send(result.content);
	},
};
