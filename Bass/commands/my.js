// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');
const replies = require('../modules/bass-reply-loading.js');
const gangUpdate = require ('../modules/gang-update.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../../modules/api-gsheet.js');
const CapoObject = require ('../modules/bass-capo-object.js');

let stararray;
let maxcapolevel;
let maxgearlevel;
let trackingplayersspreadsheet;
let nationarray;
let familybonusarray;

let trackingplayersheet;
let italy;
let mexico;
let japan;

let goldarray;
let purplearray;
let redarray;
let bluearray;
let rainbowarray;
let diamondarray;
let starsarray;


module.exports = {
	name: 'my',
	description: tongue.says('', 'my', 'description'),
	aliases: ['own', 'm'],
	usage: tongue.says('', 'my', 'usage'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'ace',

	// function in case of the initialization part of the bot has not worked fine
	async initialize(items) {
		stararray = items.arrays.stararray;
		trackingplayersspreadsheet = items.spreadsheets.trackingplayersspreadsheet;
		nationarray = items.arrays.nationarray;
		familybonusarray = items.arrays.familybonusarray;
		await CapoObject.initialize(items);

		// reference for the player streetsheet
		trackingplayersheet = {
			spreadsheetId: `${trackingplayersspreadsheet}`,
		};

		// build the array for nation bonus
		italy = nationarray[0];
		mexico = nationarray[1];
		japan = nationarray[2];

		// build the array for stars
		goldarray = stararray[0];
		purplearray = stararray[1];
		redarray = stararray[2];
		bluearray = stararray[3];
		rainbowarray = stararray[4];
		diamondarray = stararray[5];
		starsarray = goldarray.concat(purplearray).concat(redarray).concat(bluearray).concat(rainbowarray).concat(diamondarray);

		return 'my constructor loaded';
	},

	execute(message, args, client) {

		// nickname is the players discord nickname
		const nickname = message.author.username;

		// reference for the personnal sheet in which each player has his data
		const personalsheet = {
			spreadsheetId: `${trackingplayersspreadsheet}`,
			range: `${nickname}!A1:Z`,
		};

		// function to collect the personal datas
		async function collectPersonal() {
			const sheet = await gsheetlink.collectDatas(personalsheet);
			return sheet;
		}

		// function to check if the sheets are updated (gang sheet and personal sheet)
		async function checkfirst() {
			await gangUpdate.check(message, args, client);
			return ('ok');
		}

		// function use when bass ask a question and wait for an answer
		function ask(mess, timesec) {
			if (timesec == undefined) timesec = 10;
			let answer = new Promise(function(resolve, reject) {

				const filter = m => m.author.id === mess.author.id;
				const collector = mess.channel.createMessageCollector (filter, { time:timesec * 1000 });
				collector.on('collect', m => {
					resolve (m.content);
				});
				collector.on('end', collected => {
					if (collected.size < 1) reject('problem');
					reject('timeout');
				});
			}).catch (error => {
				answer = error;
			});
			return answer;
		}

		// function use when bass ask a question and wait for an answer, specific for capo when you can answer by clicking on an emoji
		async function askCapo(mess, timesec, capo) {
			let answer = new Promise(function(resolve, reject) {
				if (timesec == undefined) timesec = 20;
				if (capo === undefined) {
					mess.reply(tongue.says('', 'my', 'addcaponame'));
					const filter = m => m.author.id === mess.author.id;
					const collector = mess.channel.createMessageCollector (filter, { time:timesec * 1000 });

					collector.on('collect', m => {
						resolve (m.content);
					});
					collector.on('end', collected => {
						if (collected.size < 1) reject('problem');
						reject('timeout');
					});
				}
				else {
					const capoName = CapoObject.capobaseinfo[2][CapoObject.capobaseinfo[0].indexOf(capo)];
					const capoSkins = [];
					const capoEmoji = [];
					const capoEmojiCheck = [];
					CapoObject.capobaseinfo[2].forEach((row, i) => {
						if (row === capoName) capoSkins.push(CapoObject.capobaseinfo[0][i]);
						if (row === capoName) capoEmojiCheck.push(CapoObject.capobaseinfo[11][i]);
						if (row === capoName) capoEmoji.push(client.emojis.cache.get(CapoObject.capobaseinfo[11][i]).toString());
					});
					mess.channel.send(capoEmoji.toString().replace(',', ''));
					const custom = {
						capo : capoName,
					};
					mess.reply(tongue.says('', 'my', 'updatecaponame', custom)).then (sent => {
						for (let i = 0; i < capoSkins.length; i++) {
							sent.react(replies.capoemoji[1][replies.capoemoji[0].indexOf(capoSkins[i])]);
						}
						const filter = (reaction, user) => {
							return capoEmojiCheck.includes(reaction.emoji.id) && user.id === mess.author.id;
						};
						const reactcollector = sent.createReactionCollector(filter, { time: timesec * 1000 });
						reactcollector.on('collect', (reaction) => {
							resolve (reaction.emoji.id);
						});
						reactcollector.on('end', collected => {
							if (collected.size < 1) reject('problem');
							reject('timeout');
						});
					});
				}
			}).catch (error => {
				answer = error;
			});
			return answer;
		}

		// function star and level to collect answer about stars type, level and level
		function starsandlevel(inputdata, mess) {
			let level = '';
			let startype = '';
			let starlevel = '';
			let error = '';
			const starandlevelarray = [];
			inputdata = inputdata.replace(/[^\w\s]|_/g, '').toLowerCase();
			const inputargs = inputdata.trim().split(/ +/);
			if (inputargs.length === 2) {
				if (isNaN(Number(inputargs[0])) && !isNaN(Number(inputargs[1]))) {
					level = inputargs[1];
					startype = inputargs[0].replace(/[0-9]/g, '');
					starlevel = inputargs[0].replace(/[^0-9]/g, '');
				}
				else if (!isNaN(Number(inputargs[0])) && isNaN(Number(inputargs[1]))) {
					level = inputargs[0];
					startype = inputargs[1].replace(/[0-9]/g, '');
					starlevel = inputargs[1].replace(/[^0-9]/g, '');
				}
				else {
					error = 'novalid';
					mess.reply(tongue.says('', 'my', 'novaliddata'));
				}
			}
			else if (inputargs.length === 3) {
				inputargs.forEach(number => {
					if (isNaN(number)) startype = number;
					if (Number(number) < 6) starlevel = number;
					if (Number(number) > 5) level = number;
				});
				if (level === '') {
					if (isNaN(Number(inputargs[0]))) {
						startype = inputargs[0];
						starlevel = inputargs[1];
						level = inputargs[2];
					}
					else if (isNaN(Number(inputargs[1]))) {
						startype = inputargs[1];
						starlevel = inputargs[0];
						level = inputargs[2];
					}
					else if (isNaN(Number(inputargs[2]))) {
						startype = inputargs[2];
						starlevel = inputargs[1];
						level = inputargs[0];
					}
				}
			}
			else {
				error = 'novalid';
				mess.reply(tongue.says('', 'my', 'novaliddata'));
			}
			if (error === '' || error === undefined) {
				if (level === undefined || isNaN(Number(level)) || Number(level) < 1) {
					level = '1';
					error += tongue.says('', 'my', 'errorlevel');
				}
				if (Number(level) > Number(maxcapolevel)) {
					level = maxcapolevel;
					error += tongue.says('', 'my', 'errorlevel');
				}
				if (starlevel === undefined || isNaN(Number(starlevel)) || Number(starlevel) > 5 || Number(starlevel) < 1) {
					starlevel = '1';
					error += tongue.says('', 'my', 'errorstarlevel');
				}
				if (starsarray.includes(startype)) {
					if (goldarray.includes(startype)) startype = 'gold';
					if (purplearray.includes(startype)) startype = 'purple';
					if (redarray.includes(startype)) startype = 'red';
					if (bluearray.includes(startype)) startype = 'blue';
					if (rainbowarray.includes(startype)) startype = 'rainbow';
				}
				else {
					startype = 'gold';
					error += tongue.says('', 'my', 'errorstartype');
				}
			}
			starandlevelarray.push(level, starlevel, startype, error);
			return starandlevelarray;
		}

		async function gears(mess, type) {
			const custom = {};
			if (type === 'weapon') custom.geartype = tongue.says('', 'my', 'geartypeweapon');
			if (type === 'armor') custom.geartype = tongue.says('', 'my', 'geartypearmor');
			if (type === 'ring') custom.geartype = tongue.says('', 'my', 'geartypering');
			if (type === 'necklace') custom.geartype = tongue.says('', 'my', 'geartypenecklace');
			mess.reply(tongue.says(mess, 'my', 'gear', custom));
			const gear = await ask(mess, 300);
			if (gear === undefined || gear.toLowerCase().includes('quit')) return 'quit';
			let gearerror;
			let basegear = [0, 0, 0, 0, 0];
			if (gear !== '0') {
				const geararray = starsandlevel(gear, mess);
				let gearlevel = geararray[0];
				if (gearlevel > maxgearlevel) gearlevel = maxgearlevel;
				const gearstarlevel = geararray[1];
				const gearstartype = geararray[2];
				gearerror = geararray[3];
				let geartype = '0';
				mess.reply(tongue.says(mess, 'my', 'deluxegear'));
				let deluxe = await ask(message, 300);
				if (deluxe === undefined || deluxe.toLowerCase().includes('quit')) return 'quit';
				if (deluxe.toLowerCase().includes('yes') || deluxe.toLowerCase().includes('y')) {
					deluxe = true;
				}
				else {
					deluxe = false;
				}
				if (deluxe && (gearstartype === 'rainbow' || (gearstartype === 'blue' && gearstarlevel === '5')) && type !== 'necklace') {
					const gearListSearch = `typegear${type}`;
					let itemNumber = 0;
					if (type === 'weapon') {
						custom.geartype = tongue.says('', 'my', 'geartypeweapon');
						itemNumber = 4;
					}
					if (type === 'armor') {
						custom.geartype = tongue.says('', 'my', 'geartypearmor');
						itemNumber = 3;
					}
					if (type === 'ring') {
						custom.geartype = tongue.says('', 'my', 'geartypering');
						itemNumber = 3;
					}
					let gearlist = '';
					for (let i = 1; i < itemNumber; i++) {
						gearlist += tongue.says('', 'my', `${gearListSearch}${i}`);
					}
					custom.gearlist = gearlist;
					mess.reply(tongue.says(mess, 'my', 'typegear', custom));
					geartype = await ask(mess, 300);
					if (geartype === undefined || geartype.toLowerCase().includes('quit')) return 'quit';
					if (!(Number(geartype) >= 1 && Number(geartype) <= 4)) {
						geartype = '0';
						gearerror += tongue.says('', 'my', 'errordeluxetype');
					}
				}
				else {
					geartype = '0';
				}
				basegear = [gearstarlevel + gearstartype, gearlevel, deluxe, geartype, gearerror];
			}
			return basegear;
		}

		// function to update family bonus
		async function updateFamilyBonus(answer, bonus) {

			const inputbonus = {
				italian : 0,
				mexican : 0,
				japanese : 0,
				maxlevel : familybonusarray.length,
			};

			answer.reply(tongue.says('', 'my', 'italianbonus'));
			inputbonus.italian = await ask(answer, 60);
			if (isNaN(parseInt(inputbonus.italian)) || parseInt(inputbonus.italian) < 1 || parseInt(inputbonus.italian) > familybonusarray.length) {
				answer.reply(tongue.says('', 'my', 'wrongfamilybonus', inputbonus));
			}
			else {
				bonus.italian = inputbonus.italian;
			}
			answer.reply(tongue.says('', 'my', 'mexicanbonus'));
			inputbonus.mexican = await ask(answer, 60);
			if (isNaN(parseInt(inputbonus.mexican)) || parseInt(inputbonus.mexican) < 1 || parseInt(inputbonus.mexican) > familybonusarray.length) {
				answer.reply(tongue.says('', 'my', 'wrongfamilybonus', inputbonus));
			}
			else {
				bonus.mexican = inputbonus.mexican;
			}

			answer.reply(tongue.says('', 'my', 'japanesebonus'));
			inputbonus.japanese = await ask(answer, 60);
			if (isNaN(parseInt(inputbonus.japanese)) || parseInt(inputbonus.japanese) < 1 || parseInt(inputbonus.japanese) > familybonusarray.length) {
				answer.reply(tongue.says('', 'my', 'wrongfamilybonus', inputbonus));
			}
			else {
				bonus.japanese = inputbonus.japanese;
			}

			personalsheet.resource = {
				valueInputOption: 'RAW',
				data: [],
			};
			personalsheet.resource.data.push({
				range: `${nickname}!A7:C7`,
				values: [[bonus.italian, bonus.mexican, bonus.japanese]],
			});
			gsheetlink.updateValues(personalsheet);
			delete personalsheet.resource;
			message.reply(tongue.says('', 'my', 'actualbonus', bonus));
		}

		// function to add a new capo
		async function addCapo(mess) {
			const newcapo = [];
			mess.reply(tongue.says(mess, 'my', 'startaddcapo'));
			const input = await askCapo(mess, 60);
			if (input === undefined || input.toLowerCase().includes('quit')) return newcapo;
			if (!isNaN(Number(input))) {
				if (CapoObject.capobaseinfo[11].includes(input)) newcapo.push(CapoObject.capobaseinfo[0][CapoObject.capobaseinfo[11].indexOf(input)]);
			}
			else if (CapoObject.capobaseinfo[CapoObject.capobaseinfo.length - 1].includes(input)) {
				for (let i = 0; i < CapoObject.capobaseinfo[0].length; i++) {
					if (CapoObject.capobaseinfo[0][i] === input.toLowerCase() || CapoObject.capobaseinfo[2][i].toLowerCase() === input.toLowerCase() || CapoObject.capobaseinfo[3][i].toLowerCase() === input.toLowerCase() || CapoObject.capobaseinfo[12][i].toLowerCase().search(input.toLowerCase()) !== -1) {
						if (CapoObject.capobaseinfo[1][i].length < 5) {
							const addskin = await askCapo(mess, 30, CapoObject.capobaseinfo[0][i]);
							if (!isNaN(Number(addskin))) {
								if (CapoObject.capobaseinfo[11].includes(addskin)) newcapo.push(CapoObject.capobaseinfo[0][CapoObject.capobaseinfo[11].indexOf(addskin)]);
							}
							else {
								newcapo.push(input);
							}
						}
						else {
							newcapo.push(CapoObject.capobaseinfo[0][i]);
						}
						break;
					}
				}
			}
			else {
				mess.reply(tongue.says('', 'my', 'novaliddata'));
			}
			if (newcapo[0] !== undefined) {
				const newcaponame = CapoObject.capobaseinfo[3][CapoObject.capobaseinfo[0].indexOf(newcapo[0])];
				const custom = { capo : newcaponame };
				mess.reply(tongue.says(mess, 'my', 'starsandlevelcapo', custom));
				let error = '';
				const inputlevel = await ask(mess, 300);
				if (inputlevel === undefined || inputlevel.toLowerCase().includes('quit')) return newcapo;
				const capostarsandlevel = starsandlevel(inputlevel, mess);
				const capolevel = capostarsandlevel[0];
				const capostarlevel = capostarsandlevel[1];
				const capostartype = capostarsandlevel[2];
				error = capostarsandlevel[3];
				newcapo.push(capolevel);
				newcapo.push(capostarlevel + capostartype);
				const displaycapo = [CapoObject.capobaseinfo[2][CapoObject.capobaseinfo[0].indexOf(newcapo[0])], CapoObject.capobaseinfo[1][CapoObject.capobaseinfo[0].indexOf(newcapo[0])].length > 3, capolevel, capostartype.toUpperCase(), capostarlevel];
				if (error === '' || error === undefined) error = false;
				custom.error = '';
				if (error) custom.error = tongue.says('', 'my', 'errorrecap', custom);
				custom.caponame = displaycapo[0];
				if (displaycapo[1]) {
					custom.skin = tongue.says('', 'my', 'skin');
				}
				else {
					custom.skin = tongue.says('', 'my', 'noskin');
				}
				custom.capolevel = displaycapo[2];
				custom.star = displaycapo[3];
				custom.starlevel = displaycapo[4];
				mess.reply(tongue.says(mess, 'my', 'caponamestarandlevel', custom));
			}
			if (newcapo[2] !== undefined) {
				mess.reply(tongue.says(mess, 'my', 'capogears'));
				const addgears = await ask(mess, 300);
				if (addgears === undefined || addgears.toLowerCase().includes('quit')) return newcapo;
				if (addgears.toLowerCase().includes('yes') || addgears.toLowerCase().includes('y')) {
					const weapon = await gears(mess, 'weapon');
					if (weapon === undefined || weapon === 'quit') return newcapo;
					const weaponerror = weapon.pop();
					newcapo.push(weapon);
					const armor = await gears(mess, 'armor');
					if (armor === undefined || armor === 'quit') return newcapo;
					const armorerror = armor.pop();
					newcapo.push(armor);
					const ring = await gears(mess, 'ring');
					if (ring === undefined || ring === 'quit') return newcapo;
					const ringerror = ring.pop();
					newcapo.push(ring);
					const necklace = await gears(mess, 'necklace');
					if (necklace === undefined || necklace === 'quit') return newcapo;
					const necklaceerror = necklace.pop();
					newcapo.push(necklace);
					let gearerror;
					if (weaponerror !== '') gearerror += `${tongue.says('', 'my', 'geartypeweapon')} :\n${weaponerror}\n\n`;
					if (armorerror !== '') gearerror += `${tongue.says('', 'my', 'geartypearmor')} :\n${armorerror}\n\n`;
					if (ringerror !== '') gearerror += `${tongue.says('', 'my', 'geartypering')} :\n${ringerror}\n\n`;
					if (necklaceerror !== '') gearerror += `${tongue.says('', 'my', 'geartypenecklace')} :\n${necklaceerror}\n\n`;

					const customweapon = {
						type : tongue.says(mess, 'my', 'geartypeweapon'),
						starlevel : weapon[0].slice(0, 1),
						star : weapon[0].slice(1).toUpperCase(),
						level : weapon[1],
					};
					if (weapon[2]) {
						customweapon.deluxe = tongue.says(mess, 'my', 'deluxegear');
					}
					else {
						customweapon.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
					}
					if (weapon[3] > 0) {
						customweapon.type = tongue.says(mess, 'my', `recaptypegearweapon${weapon[3]}`);
					}
					else {
						customweapon.type = '';
					}
					const customarmor = {
						type : tongue.says(mess, 'my', 'geartypearmor'),
						starlevel : armor[0].slice(0, 1),
						star : armor[0].slice(1).toUpperCase(),
						level : armor[1],
					};
					if (armor[2]) {
						customarmor.deluxe = tongue.says(mess, 'my', 'deluxegear');
					}
					else {
						customarmor.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
					}
					if (armor[3] > 0) {
						customarmor.type = tongue.says(mess, 'my', `recaptypegeararmor${armor[3]}`);
					}
					else {
						customarmor.type = '';
					}
					const customring = {
						type : tongue.says(mess, 'my', 'geartypering'),
						starlevel : ring[0].slice(0, 1),
						star : ring[0].slice(1).toUpperCase(),
						level : ring[1],
					};
					if (ring[2]) {
						customring.deluxe = tongue.says(mess, 'my', 'deluxegear');
					}
					else {
						customring.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
					}
					if (ring[3] > 0) {
						customring.type = tongue.says(mess, 'my', `recaptypegearring${ring[3]}`);
					}
					else {
						customring.type = '';
					}
					const customnecklace = {
						type : tongue.says(mess, 'my', 'geartypenecklace'),
						starlevel : necklace[0].slice(0, 1),
						star : necklace[0].slice(1).toUpperCase(),
						level : necklace[1],
					};
					if (necklace[2]) {
						customnecklace.deluxe = tongue.says(mess, 'my', 'deluxegear');
					}
					else {
						customnecklace.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
					}
					customnecklace.type = '';
					const custom = {
						error : gearerror,
						weapon : tongue.says(mess, 'my', 'gearrecap', customweapon),
						armor : tongue.says(mess, 'my', 'gearrecap', customarmor),
						ring : tongue.says(mess, 'my', 'gearrecap', customring),
						necklace : tongue.says(mess, 'my', 'gearrecap', customnecklace),
					};
					mess.reply(tongue.says(mess, 'my', 'geartotalrecap', custom));
				}
				else {
					mess.reply(tongue.says('', 'my', 'noupdatecapo'));
				}
				return newcapo;
			}
			// continue the adding capo process at the moment the name, star, level and gears should be ok, just talent are missing
			return;
		}

		// function to delete a capo
		async function deleteCapo(mess, playercapo, personaldata) {
			let list = '';
			playercapo.forEach((capo, i) => {
				const custom = {
					number : i,
					emoji : mess.client.emojis.cache.get(replies.capoemoji[1][replies.capoemoji[0].indexOf(capo[0])]).toString(),
					caponame : capo[0].toUpperCase(),
					level : capo[1],
					starlevel : capo[2].slice(0, 1),
					star : capo[2].slice(1).toUpperCase(),
				};
				list += tongue.says('', 'my', 'capomakelist', custom);
			});
			const custom = { list : list };
			mess.reply(tongue.says(mess, 'my', 'selectdeletecapo', custom));
			ask(mess, 30).then(inputmessage => {
				if (inputmessage === undefined || inputmessage.toLowerCase() == 'no' || inputmessage.toLowerCase().includes('n')) {
					mess.channel.send(tongue.says('', 'my', 'noupdatecapo'));
				}
				else if (!isNaN(Number(inputmessage) - 1) && Number(inputmessage) - 1 >= 0 && Number(inputmessage) - 1 <= playercapo.length) {
					const deleterequests = [];
					deleterequests.push({
						'deleteDimension': {
							'range': {
								'sheetId': personaldata[0][3],
								'dimension': 'ROWS',
								'startIndex': Number(inputmessage) + 9,
								'endIndex': Number(inputmessage) + 10,
							},
						},
					});
					const requests = deleterequests;
					trackingplayersheet.resource = { requests };
					// delete members from the list
					if (deleterequests.length) {
						gsheetlink.updateSheet(trackingplayersheet);
						delete trackingplayersheet.ressource;
					}
				}
				else {
					message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
				}
			});
		}

		// function to update a capo
		async function updateCapo(mess, capoupdate) {
			const addskin = await askCapo(mess, 300, capoupdate[0]);
			if (addskin !== undefined && CapoObject.capobaseinfo[11].includes(addskin)) capoupdate[0] = CapoObject.capobaseinfo[0][CapoObject.capobaseinfo[11].indexOf(addskin)];
			const custom = {
				star : capoupdate[2].slice(1).toUpperCase(),
				starlevel : capoupdate[2].slice(0, 1),
				level : capoupdate[1],
			};
			mess.reply(tongue.says(mess, 'my', 'updatecapostarandlevel', custom));
			const updatelevel = await ask(mess, 300);
			if (updatelevel !== undefined && (updatelevel.toLowerCase() == 'yes' || updatelevel.toLowerCase().includes('y'))) {
				const caponame = CapoObject.capobaseinfo[3][CapoObject.capobaseinfo[0].indexOf(capoupdate[0])];
				custom.capo = caponame;
				mess.reply(tongue.says(mess, 'my', 'starsandlevelcapo', custom));
				let error = '';
				const inputlevel = await ask(mess, 300);
				if (inputlevel === undefined || inputlevel.toLowerCase().includes('quit')) return capoupdate;
				const capostarsandlevel = starsandlevel(inputlevel, mess);
				const capolevel = capostarsandlevel[0];
				const capostarlevel = capostarsandlevel[1];
				const capostartype = capostarsandlevel[2];
				error = capostarsandlevel[3];
				capoupdate[1] = capolevel;
				capoupdate[2] = capostarlevel + capostartype;
				const displaycapo = [CapoObject.capobaseinfo[2][CapoObject.capobaseinfo[0].indexOf(capoupdate[0])], CapoObject.capobaseinfo[1][CapoObject.capobaseinfo[0].indexOf(capoupdate[0])].length > 3, capolevel, capostartype.toUpperCase(), capostarlevel];
				if (error === '' || error === undefined) error = false;
				custom.error = '';
				if (error) custom.error = tongue.says('', 'my', 'errorrecap', custom);
				custom.caponame = displaycapo[0];
				if (displaycapo[1]) {
					custom.skin = tongue.says('', 'my', 'skin');
				}
				else {
					custom.skin = tongue.says('', 'my', 'noskin');
				}
				custom.capolevel = displaycapo[2];
				custom.star = displaycapo[3];
				custom.starlevel = displaycapo[4];
				mess.reply(tongue.says(mess, 'my', 'caponamestarandlevel', custom));
			}
			let weapon = capoupdate[3].split(',');
			weapon[2] = Boolean(weapon[2]);
			let customweapon = {
				type : tongue.says(mess, 'my', 'geartypearmor'),
				starlevel : weapon[0].replace(/[0-9]/g, ''),
				star : weapon[0].replace(/[^0-9]/g, '').toUpperCase(),
				level : weapon[1],
			};
			if (weapon[2]) {
				customweapon.deluxe = tongue.says(mess, 'my', 'deluxegear');
			}
			else {
				customweapon.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
			}
			if (weapon[3] > 0) {
				customweapon.moretype = tongue.says(mess, 'my', `recaptypegearweapon${weapon[3]}`);
			}
			else {
				customweapon.moretype = '';
			}
			let armor = capoupdate[4].split(',');
			armor[2] = Boolean(armor[2]);
			let customarmor = {
				type : tongue.says(mess, 'my', 'geartypearmor'),
				starlevel : armor[0].replace(/[0-9]/g, ''),
				star : armor[0].replace(/[^0-9]/g, '').toUpperCase(),
				level : armor[1],
			};
			if (armor[2]) {
				customarmor.deluxe = tongue.says(mess, 'my', 'deluxegear');
			}
			else {
				customarmor.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
			}
			if (armor[3] > 0) {
				customarmor.moretype = tongue.says(mess, 'my', `recaptypegeararmor${armor[3]}`);
			}
			else {
				customarmor.moretype = '';
			}
			let ring = capoupdate[5].split(',');
			ring[2] = Boolean(ring[2]);
			let customring = {
				type : tongue.says(mess, 'my', 'geartypering'),
				starlevel : ring[0].replace(/[0-9]/g, ''),
				star : ring[0].replace(/[^0-9]/g, '').toUpperCase(),
				level : ring[1],
			};
			if (ring[2]) {
				customring.deluxe = tongue.says(mess, 'my', 'deluxegear');
			}
			else {
				customring.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
			}
			if (ring[3] > 0) {
				customring.moretype = tongue.says(mess, 'my', `recaptypegearring${ring[3]}`);
			}
			else {
				customring.moretype = '';
			}
			let necklace = capoupdate[6].split(',');
			necklace[2] = Boolean(necklace[2]);
			let customnecklace = {
				type : tongue.says(mess, 'my', 'geartypenecklace'),
				starlevel : necklace[0].replace(/[0-9]/g, ''),
				star : necklace[0].replace(/[^0-9]/g, '').toUpperCase(),
				level : necklace[1],
			};
			if (necklace[2]) {
				customnecklace.deluxe = tongue.says(mess, 'my', 'deluxegear');
			}
			else {
				customnecklace.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
			}
			customnecklace.type = '';
			custom.weapon = tongue.says(mess, 'my', 'gearrecap', customweapon);
			custom.armor = tongue.says(mess, 'my', 'gearrecap', customarmor);
			custom.ring = tongue.says(mess, 'my', 'gearrecap', customring);
			custom.necklace = tongue.says(mess, 'my', 'gearrecap', customnecklace);
			mess.reply(tongue.says(mess, 'my', 'updatecapogear', custom));
			const updategears = await ask(mess, 30);
			if (updategears !== undefined && (updategears.toLowerCase() == 'yes' || updategears.toLowerCase().includes('y'))) {
				weapon = await gears(mess, 'weapon');
				if (weapon === undefined || weapon === 'quit') return capoupdate;
				const weaponerror = weapon.pop();
				capoupdate[3] = weapon;
				armor = await gears(mess, 'armor');
				if (armor === undefined || armor === 'quit') return capoupdate;
				const armorerror = armor.pop();
				capoupdate[4] = armor;
				ring = await gears(mess, 'ring');
				if (ring === undefined || ring === 'quit') return capoupdate;
				const ringerror = ring.pop();
				capoupdate[5] = ring;
				necklace = await gears(mess, 'necklace');
				if (necklace === undefined || necklace === 'quit') return capoupdate;
				const necklaceerror = necklace.pop();
				capoupdate[5] = necklace;
				let gearerror;
				if (weaponerror !== '') gearerror += `${tongue.says('', 'my', 'geartypeweapon')} :\n${weaponerror}\n\n`;
				if (armorerror !== '') gearerror += `${tongue.says('', 'my', 'geartypearmor')} :\n${armorerror}\n\n`;
				if (ringerror !== '') gearerror += `${tongue.says('', 'my', 'geartypering')} :\n${ringerror}\n\n`;
				if (necklaceerror !== '') gearerror += `${tongue.says('', 'my', 'geartypenecklace')} :\n${necklaceerror}\n\n`;

				customweapon = {
					type : tongue.says(mess, 'my', 'geartypeweapon'),
					starlevel : weapon[0].slice(0, 1),
					star : weapon[0].slice(1).toUpperCase(),
					level : weapon[1],
				};
				if (weapon[2]) {
					customweapon.deluxe = tongue.says(mess, 'my', 'deluxegear');
				}
				else {
					customweapon.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
				}
				if (weapon[3] > 0) {
					customweapon.type = tongue.says(mess, 'my', `recaptypegearweapon${weapon[3]}`);
				}
				else {
					customweapon.type = '';
				}
				customarmor = {
					type : tongue.says(mess, 'my', 'geartypearmor'),
					starlevel : armor[0].slice(0, 1),
					star : armor[0].slice(1).toUpperCase(),
					level : armor[1],
				};
				if (armor[2]) {
					customarmor.deluxe = tongue.says(mess, 'my', 'deluxegear');
				}
				else {
					customarmor.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
				}
				if (armor[3] > 0) {
					customarmor.type = tongue.says(mess, 'my', `recaptypegeararmor${armor[3]}`);
				}
				else {
					customarmor.type = '';
				}
				customring = {
					type : tongue.says(mess, 'my', 'geartypering'),
					starlevel : ring[0].slice(0, 1),
					star : ring[0].slice(1).toUpperCase(),
					level : ring[1],
				};
				if (ring[2]) {
					customring.deluxe = tongue.says(mess, 'my', 'deluxegear');
				}
				else {
					customring.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
				}
				if (ring[3] > 0) {
					customring.type = tongue.says(mess, 'my', `recaptypegearring${ring[3]}`);
				}
				else {
					customring.type = '';
				}
				customnecklace = {
					type : tongue.says(mess, 'my', 'geartypenecklace'),
					starlevel : necklace[0].slice(0, 1),
					star : necklace[0].slice(1).toUpperCase(),
					level : necklace[1],
				};
				if (necklace[2]) {
					customnecklace.deluxe = tongue.says(mess, 'my', 'deluxegear');
				}
				else {
					customnecklace.deluxe = tongue.says(mess, 'my', 'nodeluxegear');
				}
				customnecklace.type = '';
				custom.error = gearerror;
				custom.weapon = tongue.says(mess, 'my', 'gearrecap', customweapon);
				custom.armor = tongue.says(mess, 'my', 'gearrecap', customarmor);
				custom.ring = tongue.says(mess, 'my', 'gearrecap', customring);
				custom.necklace = tongue.says(mess, 'my', 'gearrecap', customnecklace);
				mess.reply(tongue.says(mess, 'my', 'geartotalrecap', custom));
			}
			return capoupdate;
		}

		// function to show the info of one capo
		async function displayCapo(mess, capoinfos, bonus) {
			const capo = new CapoObject.Capo(capoinfos[0], capoinfos[1], capoinfos[2], capoinfos[3].split(','), capoinfos[4].split(','), capoinfos[5].split(','), capoinfos[6].split(','), capoinfos[7]);
			console.log(capo);
		}

		// start of the command
		collectPersonal().then(personaldata => {

			if (typeof personaldata === undefined) {
				checkfirst();
				personaldata = collectPersonal();
				if (typeof personaldata === undefined) return message.channel.reply(tongue.says('', 'my', 'error'));
			}
			delete personalsheet.range;

			if (!args.length) {
				message.reply(tongue.says('', 'my', 'noargument'));
				message.reply(tongue.says('', 'my', 'basicusage'));
				return;
			}

			const command = args.shift().toLowerCase();

			if (command === 'bonus') {
				const bonus = {
					italian: personaldata[6][0],
					mexican: personaldata[6][1],
					japanese: personaldata[6][2],
				};
				if (!args.length) {
					message.reply(tongue.says('', 'my', 'actualbonus', bonus));
					message.reply(tongue.says('', 'my', 'basicbonus'));
					message.reply(tongue.says('', 'my', 'askupdatebonus'));
					ask(message, 300).then(inputmessage => {

						if (inputmessage === undefined) return;

						if (inputmessage.toLowerCase() == 'yes' || inputmessage.toLowerCase().includes('y')) {
							updateFamilyBonus(message, bonus);
						}
						else if (inputmessage.toLowerCase() == 'no' || inputmessage.toLowerCase().includes('n')) {
							message.channel.send(tongue.says('', 'my', 'noupdatebonus'));
						}
						else {
							message.channel.send(tongue.says('', 'my', 'noupdatebonus'));
						}
					});
				}
				else if (args.length > 1) {
					const argument1 = args.shift().toLowerCase();
					const argument2 = args.shift().toLowerCase();
					let nation;
					let familybonus;
					if (!isNaN(Number(argument1))) familybonus = parseInt(argument1);
					if (!isNaN(Number(argument2))) familybonus = parseInt(argument2);
					if (italy.includes(argument1)) nation = 'italy';
					if (mexico.includes(argument1)) nation = 'mexico';
					if (japan.includes(argument1)) nation = 'japan';
					if (italy.includes(argument2)) nation = 'italy';
					if (mexico.includes(argument2)) nation = 'mexico';
					if (japan.includes(argument2)) nation = 'japan';
					if (nation !== undefined && familybonus !== undefined) {
						if (familybonus < 1 || familybonus > 23) return message.reply(tongue.says('', 'my', 'wrongfamilybonus'));
						let range ;
						const values = [[familybonus]];
						if (nation === 'italy') {
							range = 'A7:A8';
							bonus.italian = familybonus;
						}
						if (nation === 'mexico') {
							range = 'B7:B8';
							bonus.mexican = familybonus;
						}
						if (nation === 'japan') {
							range = 'C7:C8';
							bonus.japanese = familybonus;
						}
						personalsheet.resource = {
							valueInputOption: 'RAW',
							data: [],
						};
						personalsheet.resource.data.push({
							range: `${nickname}!${range}`,
							values: values,
						});
						gsheetlink.updateValues(personalsheet);
						delete personalsheet.resource;
						message.reply(tongue.says('', 'my', 'actualbonus', bonus));
					}
				}
			}

			if (command === 'capo') {
				const playercapolist = [];
				let completelist = '';
				let list = '';
				if (!args.length && personaldata[10] !== undefined) {
					let i = 10;
					while (personaldata[i] !== undefined) {
						const playercapo = [];
						let j = 0;
						while (personaldata[i][j] !== undefined) {
							playercapo.push(personaldata[i][j]);
							j++;
						}
						let weapon = '';
						let armor = '';
						let ring = '';
						let necklace = '';
						let talent = '';
						if (playercapo[4] !== 0) weapon += `*Weapon* ${playercapo[4]} `;
						if (playercapo[5] !== 0) armor += `*Armor* ${playercapo[5]} `;
						if (playercapo[6] !== 0) ring += `*Ring* ${playercapo[6]} `;
						if (playercapo[7] !== 0) necklace += `*Necklace* ${playercapo[7]} `;
						if (playercapo[8] !== 0) talent += `*Talents* ${playercapo[8]} `;
						const custom = {
							number : i - 9,
							emoji : message.client.emojis.cache.get(replies.capoemoji[1][replies.capoemoji[0].indexOf(playercapo[0])]),
							caponame : playercapo[0],
							level : playercapo[1],
							starlevel : playercapo[2].slice(0, 1),
							star : playercapo[2].slice(1).toUpperCase(),
							weapon : weapon,
							armor : armor,
							ring : ring,
							necklace : necklace,
							talent : talent,
						};
						completelist += tongue.says('', 'my', 'capomakecompletelist', custom);
						list += tongue.says('', 'my', 'capomakelist', custom);
						i++;
					}
					const custom = { list : completelist };
					message.reply(tongue.says(message, 'my', 'actualcapolist', custom));
				}
				if (!args.length) {
					message.reply(tongue.says(message, 'my', 'askupdatecapo'));
					ask(message, 30).then(inputmessage => {
						if (inputmessage === undefined) return;
						if (inputmessage.toLowerCase() == 'add' || inputmessage.toLowerCase().includes('new')) {
							addCapo(message).then(newcapo => {
								const addcapolist = [];
								if (newcapo[0] !== undefined)	addcapolist.push(newcapo[0]);
								if (newcapo[1] !== undefined)	addcapolist.push(newcapo[1]);
								if (newcapo[2] !== undefined)	addcapolist.push(newcapo[2]);
								if (newcapo[3] !== undefined) addcapolist.push(newcapo[3].toString());
								if (newcapo[4] !== undefined) addcapolist.push(newcapo[4].toString());
								if (newcapo[5] !== undefined) addcapolist.push(newcapo[5].toString());
								if (newcapo[6] !== undefined) addcapolist.push(newcapo[6].toString());
								if (newcapo[7] !== undefined) addcapolist.push(newcapo[7].toString());
								if (addcapolist.length) {
									const addcaporequest = {
										spreadsheetId: `${trackingplayersspreadsheet}`,
									};
									addcaporequest.valueInputOption = 'RAW';
									addcaporequest.range = `${nickname}!A11:J`;
									addcaporequest.insertDataOption = 'INSERT_ROWS';
									addcaporequest.resource = {
										range: `${nickname}!A11:J`,
										values: [addcapolist],
									};
									gsheetlink.appendValues(addcaporequest);
									personaldata.push(addcapolist);
									message.reply(tongue.says(message, 'my', 'capoadded'));
								}
							});
						}
						else if (inputmessage.toLowerCase() == 'update' || inputmessage.toLowerCase().includes('up')) {
							const custom = { list : list };
							message.reply(tongue.says(message, 'my', 'selectupdatecapo', custom));
							ask(message, 300).then(updatemessage => {
								if (updatemessage.toLowerCase() == 'no' || updatemessage.toLowerCase().includes('n')) {
									message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
								}
								else if (updatemessage === undefined) {
									message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
								}
								else if (!isNaN(Number(updatemessage) - 1) && Number(updatemessage) - 1 >= 0 && Number(updatemessage) - 1 <= playercapolist.length) {
									const capoupdate = personaldata[9 + Number(updatemessage)];
									updateCapo(message, capoupdate, personaldata).then (capo =>{
										const updaterequest = {
											spreadsheetId: `${trackingplayersspreadsheet}`,
											resource: {
												valueInputOption: 'RAW',
											},
										};
										const individualrequests = [];
										individualrequests.push({
											range: `${nickname}!A${10 + Number(updatemessage)}:J${10 + Number(updatemessage)}`,
											values: [capo],
										});
										updaterequest.resource.data = individualrequests;
										// update capo to the spreadsheet
										gsheetlink.updateValues(updaterequest);
										delete updaterequest.resource;
										message.reply(tongue.says(message, 'my', 'capoadded'));
									});
								}
								else {
									message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
								}
							});
						}
						else if (inputmessage.toLowerCase() == 'delete' || inputmessage.toLowerCase().includes('del')) {
							deleteCapo(message, playercapolist, personaldata);
						}
						else if (inputmessage.toLowerCase() == 'info' || inputmessage.toLowerCase().includes('infos')) {
							const custom = { list : list };
							message.reply(tongue.says(message, 'my', 'selectinfocapo', custom));
							ask(message, 300).then(infomessage => {
								if (infomessage.toLowerCase() == 'no' || infomessage.toLowerCase().includes('n')) {
									message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
								}
								else if (infomessage === undefined) {
									message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
								}
								else if (!isNaN(Number(infomessage) - 1) && Number(infomessage) - 1 >= 0 && Number(infomessage) - 1 <= playercapolist.length) {
									const capoinfos = personaldata[9 + Number(infomessage)];
									const bonus = {
										italian: personaldata[6][0],
										mexican: personaldata[6][1],
										japanese: personaldata[6][2],
									};
									message.reply(tongue.says('', 'my', 'actualbonus', bonus));
									message.reply(tongue.says('', 'my', 'askupdatebonus'));
									ask(message, 300).then(bonusmessage => {
										if (bonusmessage === undefined) {
											message.channel.send(tongue.says('', 'my', 'noupdatebonus'));
										}
										else if (bonusmessage.toLowerCase() == 'yes' || bonusmessage.toLowerCase().includes('y')) {
											updateFamilyBonus(message, bonus);
										}
										else if (bonusmessage.toLowerCase() == 'no' || inputmessage.toLowerCase().includes('n')) {
											message.channel.send(tongue.says('', 'my', 'noupdatebonus'));
										}
										else {
											message.channel.send(tongue.says('', 'my', 'noupdatebonus'));
										}
									});
									displayCapo(message, capoinfos, bonus);
								}
							});
						}
						else if (inputmessage.toLowerCase() == 'no' || inputmessage.toLowerCase().includes('n')) {
							message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
						}
						else {
							message.channel.send(tongue.says('', 'my', 'noupdatecapo'));
						}
					});
				}
			}
		});
	},
};
