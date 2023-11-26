const render = require('./render.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'capo';
const bassTitle = 'bass';
const locationTitle = 'location';

let eventArray;
const eventTotal = [];
let cigarData;
let eventData;
let eventDataTitle;
let starData;
let stararray;

module.exports = {
	name: 'capo',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['capos', 'cap'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'public',

	async initialize(items) {
		stararray = items.arrays.stararray;
		eventArray = items.arrays.locationarray.slice(2);
		eventArray.forEach(event =>{
			event.forEach(name => {
				eventTotal.push(name);
			});
		});
		// building the request for the GoogleSheet API
		const sheetrequest = {
			spreadsheetId:`${items.spreadsheets.spreadsheet}`,
			range:'cigars!A2:B',
		};

		cigarData = await gsheetlink.collectDatas(sheetrequest);

		sheetrequest.range = 'event capo!A1:I';

		eventData = await gsheetlink.collectDatas(sheetrequest);
		eventDataTitle = eventData.shift();

		sheetrequest.range = 'stars!A2:D';

		starData = await gsheetlink.collectDatas(sheetrequest);

		return 'capo data loaded';

	},

	execute(message, args) {

		if(!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		const command = args.shift().toLowerCase();
		let playerwish;

		if (command === 'upgrade' || command === 'up' || command === 'upgr') {
			if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));

			if (args[0].toLowerCase() === 'event') {
				args.shift();
				playerwish = 'event';
			}
			else if (eventTotal.includes(args[0].toLowerCase())) {
				playerwish = 'event';
			}
			else if (isNaN(Number(args[0]))) {
				playerwish = 'star';
			}
			else if (!isNaN(Number(args[0])) && args.length < 2) {
				playerwish = 'cigar';
			}
			else if (!isNaN(Number(args[0])) && args.length > 1 && !isNaN(Number(args[1]))) {
				playerwish = 'cigar';
			}
			else if (!isNaN(Number(args[0])) && args.length > 1 && isNaN(Number(args[1]))) {
				playerwish = 'star';
			}

			if (playerwish === 'cigar') {
				let level1 = Number(args.shift());
				let level2 = 1;
				if (args.length) level2 = Number(args.shift());
				if (isNaN(level1) && isNaN(level2)) return message.channel.send(tongue.says(message, chapterTitle, 'cigarwrongargument'));
				if (isNaN(level1)) level1 = 1;
				if (isNaN(level2)) level2 = 1;
				if (level1 < 1) level1 = 1;
				if (level2 < 1) level2 = 1;


				if (level1 > cigarData.length) level1 = cigarData.length + 1;
				if (level2 > cigarData.length) level2 = cigarData.length + 1;
				const cigar1 = Number(cigarData[level1 - 1][1]);
				const cigar2 = Number(cigarData[level2 - 1][1]);

				if (level1 > level2) {
					let total = (cigar1 - cigar2).toString();
					total = render.toletter(total);
					const custom = {
						baselevel : level2,
						level : level1,
						cigars : total,
					};
					if (level2 === 1) {
						return message.channel.send(tongue.says(message, chapterTitle, 'cigartotal', custom));
					}
					else{
						return message.channel.send(tongue.says(message, chapterTitle, 'cigartotalfrom', custom));
					}
				}
				else if (level2 > level1) {
					let total = (cigar2 - cigar1).toString();
					total = render.toletter(total);
					const custom = {
						baselevel : level1,
						level : level2,
						cigars : total,
					};
					if (level1 === 1) {
						return message.channel.send(tongue.says(message, chapterTitle, 'cigartotal', custom));
					}
					else{
						return message.channel.send(tongue.says(message, chapterTitle, 'cigartotalfrom', custom));
					}
				}
				else {
					return message.channel.send(tongue.says(message, chapterTitle, 'nocalculation'));
				}
			}
			else if (playerwish === 'event') {

				if (message.channel.type === 'DM' && !(message.author.privilege.premium || message.author.privilege.ace)) return message.channel.send(tongue.says(message, bassTitle, 'premiumserverrestricted'));
				if (message.channel.type !== 'DM' && !(message.guild.privilege.ace || message.guild.privilege.premium || message.author.privilege.premium || message.author.privilege.ace)) return message.channel.send(tongue.says(message, bassTitle, 'premiumserverrestricted'));

				if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'wrongevent'));

				let eventname = args.shift().toLowerCase();
				let eventcolumn;
				let eventExist = false;

				eventArray.forEach((event, i) => {
					if (event.includes(eventname)) {
						eventname = eventArray[i][0];
						eventcolumn = eventDataTitle.indexOf(eventname);
						eventExist = true;
					}
				});

				if (!eventExist)	return message.channel.send(tongue.says(message, chapterTitle, 'wrongevent'));

				let level1 = Number(args.shift());
				let level2 = 1;
				if (args.length) level2 = Number(args.shift());
				if (isNaN(level1) && isNaN(level2)) return message.channel.send(tongue.says(message, chapterTitle, 'cigarwrongargument'));
				if (isNaN(level1)) level1 = 1;
				if (isNaN(level2)) level2 = 1;
				if (level1 < 1) level1 = 1;
				if (level2 < 1) level2 = 1;


				if (level1 > eventData.length) level1 = eventData.length + 1;
				if (level2 > eventData.length) level2 = eventData.length + 1;
				const cigar1 = Number(eventData[level1 - 1][eventcolumn]);
				const cigar2 = Number(eventData[level2 - 1][eventcolumn]);

				if (level1 > level2) {
					let total = (cigar1 - cigar2).toString();
					total = render.toletter(total);
					const custom = {
						baselevel : level2,
						level : level1,
						cigars : total,
						event : tongue.says(message, locationTitle, eventname).replace(/\n/g, ''),
						resources : tongue.says(message, locationTitle, `${eventname}gold`).replace(/\n/g, ''),
					};
					if (level2 === 1) {
						return message.channel.send(tongue.says(message, chapterTitle, 'eventtotal', custom));
					}
					else{
						return message.channel.send(tongue.says(message, chapterTitle, 'eventtotalfrom', custom));
					}
				}
				else if (level2 > level1) {
					let total = (cigar2 - cigar1).toString();
					total = render.toletter(total);
					const custom = {
						baselevel : level1,
						level : level2,
						cigars : total,
						event : tongue.says(message, chapterTitle, eventname).replace(/\n/g, ''),
						resources : tongue.says(message, chapterTitle, `${eventname}gold`).replace(/\n/g, ''),
					};
					if (level1 === 1) {
						return message.channel.send(tongue.says(message, chapterTitle, 'eventtotal', custom));
					}
					else{
						return message.channel.send(tongue.says(message, chapterTitle, 'eventtotalfrom', custom));
					}
				}
				else {
					return message.channel.send(tongue.says(message, chapterTitle, 'nocalculation'));
				}
			}
			else if (playerwish === 'star') {
				if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));

				const goldarray = stararray[0];
				const purplearray = stararray[1];
				const redarray = stararray[2];
				const bluearray = stararray[3];
				const rainbowarray = stararray[4];
				const diamondarray = stararray[5];
				const starsarray = goldarray.concat(purplearray).concat(redarray).concat(bluearray).concat(rainbowarray).concat(diamondarray);
				const posstararray = goldarray[0].concat(purplearray[0]).concat(redarray[0]).concat(bluearray[0]).concat(rainbowarray[0]).concat(diamondarray[0]);

				let error = 0;
				let argument1;
				let argument2;
				const star = [];
				const starlevel = [];
				let tostartype = '';
				let tostarlevel = 1;
				let fromstartype = 'gold';
				let fromstarlevel = 5;

				while (args.length) {
					argument1 = args.shift();
					if (!argument1) break;
					argument1 = argument1.toLowerCase();
					if (args.length) argument2 = args.shift().toLowerCase();

					if (starsarray.includes(argument1) && !isNaN(Number(argument2))) {
						star.push(argument1);
						starlevel.push(Number(argument2));
					}
					else if (!isNaN(Number(argument1)) && starsarray.includes(argument2)) {
						star.push(argument2);
						starlevel.push(Number(argument1));
					}
					else {
						if (argument2 !== 'undefined') args.unshift(argument2);
						argument2 = argument1.replace(/[^0-9]/g, '');
						argument1 = argument1.replace(/[0-9]/g, '');
						if (starsarray.includes(argument1) && !isNaN(Number(argument2))) {
							star.push(argument1);
							starlevel.push(Number(argument2));
						}
						else if (!isNaN(Number(argument1)) && starsarray.includes(argument2)) {
							star.push(argument2);
							starlevel.push(Number(argument1));
						}
						else {
							error = argument1;
						}
					}
					argument2 = 'undefined';
				}

				if (star.length === 1) {
					tostartype = star[0];
					if (goldarray.includes(tostartype)) tostartype = 'gold';
					if (purplearray.includes(tostartype)) tostartype = 'purple';
					if (redarray.includes(tostartype)) tostartype = 'red';
					if (bluearray.includes(tostartype)) tostartype = 'blue';
					if (rainbowarray.includes(tostartype)) tostartype = 'rainbow';
					if (diamondarray.includes(tostartype)) tostartype = 'diamond';
					tostarlevel = starlevel[0];
				}
				else if (star.length > 1) {
					if (goldarray.includes(star[0])) star[0] = 'gold';
					if (purplearray.includes(star[0])) star[0] = 'purple';
					if (redarray.includes(star[0])) star[0] = 'red';
					if (bluearray.includes(star[0])) star[0] = 'blue';
					if (rainbowarray.includes(star[0])) star[0] = 'rainbow';
					if (diamondarray.includes(star[0])) star[0] = 'diamond';
					if (goldarray.includes(star[1])) star[1] = 'gold';
					if (purplearray.includes(star[1])) star[1] = 'purple';
					if (redarray.includes(star[1])) star[1] = 'red';
					if (bluearray.includes(star[1])) star[1] = 'blue';
					if (rainbowarray.includes(star[1])) star[1] = 'rainbow';
					if (diamondarray.includes(star[1])) star[1] = 'diamond';

					if (posstararray.indexOf(star[0]) > posstararray.indexOf(star[1])) {
						tostartype = star[0];
						fromstartype = star[1];
						tostarlevel = starlevel[0];
						fromstarlevel = starlevel[1];
					}
					else if (posstararray.indexOf(star[0]) < posstararray.indexOf(star[1])) {
						tostartype = star[1];
						fromstartype = star[0];
						tostarlevel = starlevel[1];
						fromstarlevel = starlevel[0];
					}
					else if (posstararray.indexOf(star[0]) === posstararray.indexOf(star[1]) && Number(starlevel[0]) > Number(starlevel[1])) {
						tostartype = star[0];
						fromstartype = star[1];
						tostarlevel = starlevel[0];
						fromstarlevel = starlevel[1];
					}
					else if (posstararray.indexOf(star[0]) === posstararray.indexOf(star[1]) && Number(starlevel[0]) < Number(starlevel[1])) {
						tostartype = star[1];
						fromstartype = star[0];
						tostarlevel = starlevel[1];
						fromstarlevel = starlevel[0];
					}
					else {
						return message.channel.send(tongue.says(message, chapterTitle, 'nocalculation'));
					}
				}
				else {
					return message.channel.send(tongue.says(message, chapterTitle, 'missingargument'));
				}

				const fromstar = `${fromstarlevel} ${fromstartype}`;
				let tostar = `${tostarlevel} ${tostartype}`;

				let warning = '';
				const datastar = [];
				for (let i = 0; i < starData.length; i++) {
					datastar.push(starData[i][0]);
				}
				if (!datastar.includes(tostar)) tostar = datastar[datastar.length - 1];
				let starupgrade = datastar.indexOf(tostar) - datastar.indexOf(fromstar);
				if (datastar.indexOf(fromstar) < 2) {
					if (starupgrade > 1) {
						starupgrade = 1;
						tostar = datastar[1];
					}
					warning = tongue.says(message, chapterTitle, 'starupgraderare');
				}
				else if (datastar.indexOf(fromstar) < 5) {
					if (starupgrade > 2) {
						starupgrade = 2;
						tostar = datastar[4];
					}
					else if(tostar === '5 gold') {
						starupgrade -= 1;
						tostar = datastar[4];
					}
					warning = tongue.says(message, chapterTitle, 'starupgradeepic');
				}
				let same = 0;
				let nation = 0;
				let trait = 0;
				for (let i = 1; i <= starupgrade; i++) {
					same += Number(starData[datastar.indexOf(fromstar) + i][1]);
					nation += Number(starData[datastar.indexOf(fromstar) + i][2]);
					trait += Number(starData[datastar.indexOf(fromstar) + i][3]);
				}

				let cardtotal = '';
				const custom = {
					numbersc : (same - Math.floor(same)) / 0.25,
					numberpn : (nation - Math.floor(nation)) / 0.25,
					numberpt : (trait - Math.floor(trait)) / 0.25,
					numbers : Math.floor(same),
					numbern : Math.floor(nation),
					numbert : Math.floor(trait),
				};

				if (Math.floor(same) !== same) {
					cardtotal += tongue.says(message, chapterTitle, 'samecard', custom);
					same = Math.floor(same);
				}
				if (Math.floor(nation) !== nation) {
					cardtotal += tongue.says(message, chapterTitle, 'purplenation', custom);
					nation = Math.floor(nation);
				}
				if (Math.floor(trait) !== trait) {
					cardtotal += tongue.says(message, chapterTitle, 'purpletrait', custom);
					trait = Math.floor(trait);
				}

				if (same) cardtotal += tongue.says(message, chapterTitle, 'sameleg', custom);
				if (nation) cardtotal += tongue.says(message, chapterTitle, 'samenation', custom);
				if (trait) cardtotal += tongue.says(message, chapterTitle, 'sametrait', custom);

				if (error) {
					custom.text = error;
					message.channel.send(tongue.says(message, chapterTitle, 'error', custom));
				}
				if (warning) {
					custom.text = warning;
					message.channel.send(tongue.says(message, chapterTitle, 'warning', custom));
				}
				custom.fromstar = fromstar;
				custom.tostar = tostar;
				custom.cards = cardtotal;

				return message.channel.send(tongue.says(message, chapterTitle, 'starcards', custom));
			}
			else {
				return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));
			}
		}
	},
};
