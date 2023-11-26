// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../modules/api-gsheet.js');
// function tongue.says(message,command,file,situation,option)
const tongue = require ('../modules/tongue.js');

let supportspreadsheet;
let discordownerId;

const chapterTitle = 'support';
const adminTitle = 'adm';

module.exports = {
	name: 'support',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['report', 'sup'],
	usage: tongue.says('', chapterTitle, 'description'),
	help: true,
	core: true,
	privacy: 'public',

	// initialize function
	initialize(items) {
		// load the support spreadhseet id and the bot owner id
		supportspreadsheet = items.spreadsheets.supportspreadsheet;
		discordownerId = items.ids.discordownerid;
		return 'support spreadsheet loaded';
	},

	async execute(message, args, client) {

		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		// load the request for google request
		const supportrequest = {
			spreadsheetId: `${supportspreadsheet}`,
			valueInputOption: 'RAW',
			insertDataOption: 'INSERT_ROWS',
		};

		// function to send a message to the bot owner
		async function sendOwner(text) {
			// load the text to send
			text = text.join(' ');
			if (text === 'undefined') text = 'Empty support...';
			// search the bot owner user among users
			const user = await message.client.users.fetch(discordownerId);
			let guild;
			// create the report message for bot owner
			const report = [Date(), text, `${message.author.username}#${message.author.discriminator}`, message.author.id];
			let fromguild = '';
			// if the message was sent in a guild
			if (message.guild) {
				if (message.guild.available) {
					// search for info about that guild
					let guildOwner = await message.guild.members.fetch(message.guild.ownerId);
					guildOwner = guildOwner.user;
					guild = {
						guildname: message.guild.name,
						guildid: message.guild.id,
						guildowner: guildOwner,
					};
					// make the guild report message
					fromguild = tongue.says('', adminTitle, 'supportfromguild', guild);
					report.push(guild.guildname, guild.guildid, `${guild.guildowner.username}#${guild.guildowner.discriminator} ID: ${guild.guildowner.id}`);
				}
			}
			// make the report message
			const custom = {
				text : text,
				fromguild : fromguild,
				writer : `${message.author}`,
				id : message.author.id,
			};
			// send the report to owner
			user.send(tongue.says(message, adminTitle, 'supportownermessage', custom), { split: true });
			user.send(tongue.says(message, adminTitle, 'supportpossibleanswer', custom));
			// add the report in the report spreadsheet
			supportrequest.range = 'support!A2:I';
			supportrequest.resource = {
				range: 'support!A2:I',
				values: [report],
			};
			await gsheetlink.appendValues(supportrequest);
			delete supportrequest.resource;
			delete supportrequest.range;
		}
		// if the message is not sent by the bot owner send a report
		if (message.author.id !== discordownerId) {
			await sendOwner(args);
			return message.channel.send(tongue.says(message, chapterTitle, 'messagesent'));
		}
		// if the message is sent by the owner
		else {
			// an error occurs if there is no parameter
			if (!args.length) return message.author.send(tongue.says(message, chapterTitle, 'noargument'));
			const command = args.shift();
			// info give datas about a guild or a user
			if (command === 'info') {
				if (!args.length) return message.author.send(tongue.says(message, chapterTitle, 'noargument'));
				const type = args.shift();
				// info guild to get info about a specific guild
				if (type === 'guilds' || type === 'guild') {
					// with no more argument give the list of all the guilds where the bot is present
					if (!args.length) {
						client.guilds.cache.forEach(guild => {
							guild.members.fetch(guild.ownerId).then(guildowner => {
								const guildinfos = [];
								guildinfos.push(`Name : ${guild.name} / ID : ${guild.id} / OWNER : ${guildowner} - ${guildowner.user.tag} ID: ${guildowner.user.id}`);
								const custom = { list : guildinfos };
								return message.author.send(tongue.says(message, chapterTitle, 'guildlist', custom));
							});
						});
					}
					// with the guild ID get some specific data about that guild
					else {
						const guildid = args.shift();
						const guild = client.guilds.cache.get(guildid);
						// search the owner of the guild
						guild.members.fetch(guild.ownerId).then(guildowner => {
							const guildinfos = [];
							let privilege = '';
							// load privilege info for the guild
							for (const prop in guild.privilege) {
								privilege += `${prop} : ${guild.privilege[prop]} -`;
							}
							// create the message
							guildinfos.push(`Name : ${guild.name} / ID : ${guild.id} / OWNER : ${guildowner} - ${guildowner.user.tag} ID: ${guildowner.user.id}\nPrivilege : ${privilege}`);
							const custom = { guildinfo : guildinfos.join('\n') };
							return message.author.send(tongue.says(message, chapterTitle, 'guildinfo', custom));
						});
					}
				}
				// support user ID gives infos about a specific user
				else if (type === 'user') {
					if (!args.length) return message.author.send(tongue.says(message, chapterTitle, 'noargument'));
					// get the user ID
					const userref = args.shift();
					if (!isNaN(Number(userref))) {
						try {
							// search the user by its ID
							const user = await client.users.fetch(userref);
							let privilege = '';
							for (const prop in user.privilege) {
								privilege += `${prop} : ${user.privilege[prop]} -`;
							}
							// create the user info
							const userinfos = `Name : ${user.tag} / ID : ${user.id}\nPrivilege : ${privilege}`;
							const custom = {
								user : user,
								userinfos : userinfos,
							};
							// send the info
							return message.author.send(tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'userinfo', custom)));
						}
						// an error occurs if the user can't be found
						catch (e) {
							return message.author.send(tongue.sendSplitMessage(message, e));
						}
					}
				}
			}
			// support message ID of the user to send a message
			else if (command === 'message') {
				// if no ID send an error message
				if (!args.length || isNaN(Number(args[0]))) return message.author.send(tongue.says(message, chapterTitle, 'noargument'));
				// get the user ID and the discord user
				const userid = args.shift();
				let text = tongue.says(message, chapterTitle, 'default');
				if (args.length) text = args.join(' ');
				const user = await client.users.fetch(userid);
				const custom = {
					text : text,
					user : user.username,
				};
				// try to send the message to the user
				try {
					user.send(tongue.says(message, chapterTitle, 'message', custom), { split: true });
				}
				catch (e) {
					custom.error = e;
					message.author.send(tongue.says(message, adminTitle, 'messageerror', custom), { split: true });
				}
			}
			else {
				return message.author.send(tongue.says(message, chapterTitle, 'ownernoargument'));
			}
		}
	},
};
