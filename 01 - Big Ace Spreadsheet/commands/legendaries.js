// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'legendaries';
const locationTitle = 'location';

let keyarray;

module.exports = {
	name: 'legendaries',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['leg', 'legendary', 'l'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'public',

	initialize(items) {
		keyarray = items.arrays.keyarray;
		return 'key array loaded';
	},

	execute(message, args) {

		// first check if there is enough arguments
		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		// array building to find the corresponding key
		const freearray = keyarray[0];
		const goldarray = keyarray[1];
		const bluearray = keyarray[2];
		const nationarray = keyarray[3];
		const precisionarray = keyarray[4];
		const cigararray = keyarray[5];
		const shardarray = keyarray[6];
		const keysarray = freearray.concat(goldarray).concat(bluearray).concat(nationarray).concat(precisionarray).concat(cigararray).concat(shardarray);

		// constants buildings
		let error = 0;
		let argument1;
		let argument2 = 'undefined';
		let key = '';
		let keynumber = 0;
		let freenumber = 0;
		let goldnumber = 0;
		let bluenumber = 0;
		let nationnumber = 0;
		let precisionnumber = 0;
		let cigarnumber = 0;
		let shardnumber = 0;

		// message translating in keys and numbers
		while (args.length) {
			// argument1 contains the first argument
			argument1 = args.shift().toLowerCase();
			// argument2 contains the second argument if any
			if (args.length) argument2 = args.shift().toLowerCase();

			if (keysarray.includes(argument1) && !isNaN(Number(argument2))) {
				key = argument1;
				keynumber = argument2;
			}
			else if (!isNaN(Number(argument1)) && keysarray.includes(argument2)) {
				key = argument2;
				keynumber = argument1;
			}
			// if the player didn't use a proper form for the data : especially no space between key type and number
			else {
				if (argument2 !== 'undefined') args.unshift(argument2);
				argument2 = argument1.replace(/[^0-9]/g, '');
				argument1 = argument1.replace(/[0-9]/g, '');
				if (keysarray.includes(argument1) && !isNaN(Number(argument2))) {
					key = argument1;
					keynumber = argument2;
				}
				else if (!isNaN(Number(argument1)) && keysarray.includes(argument2)) {
					key = argument2;
					keynumber = argument1;
				}
				// if there is nothing to read in the argument
				else {
					error = argument1;
				}
			}

			// transferring data from the arguments to the proper key type
			if (freearray.includes(key)) freenumber += keynumber;
			if (goldarray.includes(key)) goldnumber += keynumber;
			if (bluearray.includes(key)) bluenumber += keynumber;
			if (nationarray.includes(key)) nationnumber += keynumber;
			if (precisionarray.includes(key)) precisionnumber += keynumber;
			if (cigararray.includes(key)) cigarnumber += keynumber;
			if (shardarray.includes(key)) shardnumber += keynumber;
			key = '';
			keynumber = 0;
			argument2 = 'undefined';
		}
		// if there is no key registered, there was an error in the command
		if (!freenumber && !goldnumber && !bluenumber && !nationnumber && !precisionnumber && !cigarnumber && !shardnumber) return message.channel.send(tongue.says(message, chapterTitle, 'wrongargument'));

		// keylist is used in the message given
		let keylist = [];
		if (freenumber) keylist.push(`${parseInt(freenumber)} ${tongue.says(message, locationTitle, 'free').replace('\n', '')}`);
		if (goldnumber) keylist.push(`${parseInt(goldnumber)} ${tongue.says(message, locationTitle, 'golden').replace('\n', '')}`);
		if (bluenumber) keylist.push(`${parseInt(bluenumber)} ${tongue.says(message, locationTitle, 'mystery').replace('\n', '')}`);
		if (nationnumber) keylist.push(`${parseInt(nationnumber)} ${tongue.says(message, locationTitle, 'nation').replace('\n', '')}`);
		if (precisionnumber) keylist.push(`${parseInt(precisionnumber)} ${tongue.says(message, locationTitle, 'precision').replace('\n', '')}`);
		if (cigarnumber) keylist.push(`${parseInt(cigarnumber)} ${tongue.says(message, locationTitle, 'cigar').replace('\n', '')}`);
		if (shardnumber) keylist.push(`${parseInt(shardnumber)} ${tongue.says(message, locationTitle, 'shards').replace('\n', '')}`);
		keylist = keylist.join(', ');

		// calculation of the legendary you are sure to have
		const surebluecapo = parseInt(goldnumber) - Math.floor(parseInt(goldnumber) / 10) + parseInt(freenumber);
		const surepurplecapo = Math.floor(parseInt(goldnumber) / 10) + parseInt(bluenumber) - Math.floor(parseInt(bluenumber) / 10) + parseInt(nationnumber) - Math.floor(parseInt(nationnumber) / 10) +
			parseInt(precisionnumber) - Math.floor(parseInt(precisionnumber) / 10) + parseInt(cigarnumber) - Math.floor(parseInt(cigarnumber) / 10) + Math.floor(surebluecapo / 10);

		let surelegendary = 0;
		surelegendary += Math.floor(parseInt(shardnumber) / 60);
		surelegendary += Math.floor(parseInt(bluenumber) / 10);
		surelegendary += Math.floor(parseInt(nationnumber) / 10);
		surelegendary += Math.floor(parseInt(precisionnumber) / 10);
		surelegendary += Math.floor(parseInt(cigarnumber) / 10);
		surelegendary += Math.floor(surepurplecapo / 10);
		// calculation of the legendary you can have according to the rng number given in the game
		const possiblepurplecapo = Math.round(parseInt(freenumber) * 0.42) + Math.round((parseInt(goldnumber) - Math.floor(parseInt(goldnumber) / 10)) * 0.01);
		const possiblelegendarycapo = Math.floor((surepurplecapo - 10 * Math.floor(surepurplecapo / 10) + possiblepurplecapo) / 10) + Math.round(parseInt(freenumber) * 0.05) + Math.round(parseInt(goldnumber) * 0.01) +
			Math.round(parseInt(bluenumber) * 0.01) + Math.round(parseInt(precisionnumber) * 0.01) + Math.round(parseInt(nationnumber) * 0.06);

		const	custom = {
			error : error,
			keys : keylist,
			cards : surelegendary,
			rngcards : surelegendary + possiblelegendarycapo,
		};

		if (error) message.channel.send(tongue.says(message, chapterTitle, 'error', custom));

		if (possiblelegendarycapo) {
			return message.channel.send(tongue.says(message, chapterTitle, 'keysrng', custom));
		}
		else {
			return message.channel.send(tongue.says(message, chapterTitle, 'keys', custom));
		}
	},
};
