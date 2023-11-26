const gangUpdate = require ('../modules/gang-update.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../../modules/api-gsheet.js');


module.exports = {
	name: 'track',
	description: 'track',
	idpermission: 'owner',
	aliases: ['tr', 'tracking'],
	usage: '[the discord role you want to track]',
	help:false,
	privacy: 'ace',
	guildOnly: true,

	execute(message, args, client) {

		async function checkfirst() {
			await gangUpdate.check(message, args, client);
			return ('ok');
		}

		async function getplayerssheet(sheet) {
			const response = await gsheetlink.getSheet(sheet);
			return response;
		}

		checkfirst();


		if (!args.length) return;

		const trackingcommand = args.shift().toLowerCase();

		if (trackingcommand === 'playersheetupdate') {
			const playersheet = {
				spreadsheetId : message.client.data.trackingplayersspreadsheet,
			};
			getplayerssheet(playersheet).then(datas => {
				const range = 'A9:P';
				const values = [['CAPOS'], ['Nickname', 'Level', 'Stars', 'Weapon Name', 'Weapon Star', 'Weapon Level', 'Armor Name', 'Armor Star', 'Armor Level', 'Ring Name', 'Ring Star', 'Ring Level', 'Necklace Name', 'Necklace Star', 'Necklace Level', 'talent']];
				playersheet.resource = {
					valueInputOption: 'RAW',
					data: [],
				};
				datas.sheets.forEach(sheet => {
					if (sheet.properties.sheetId !== 0) {
						playersheet.resource.data.push({
							range: `${sheet.properties.title}!${range}`,
							values: values,
						});
					}
				});
				const mess = gsheetlink.updateValues(playersheet);
				console.log(mess);
				delete playersheet.ressource;
			});
		}

		if (trackingcommand === 'diamonds' || trackingcommand === 'clubs' || trackingcommand === 'spades' || trackingcommand === 'hearts') {
			const gangmemberarray = [];

			if (trackingcommand === 'diamonds') {
				return;

			}
			if (trackingcommand === 'clubs') {
				return;
			}
			if (trackingcommand === 'spades') {
				return;

			}
			if (trackingcommand === 'hearts') {
				return;

			}
		}
	},
};
