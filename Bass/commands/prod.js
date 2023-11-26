const render = require('./render.js');
// function tongue.says(message, command, file, situation, option1, option2)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'prod';
const locationTitle = 'location';

let letterarray;

module.exports = {
	name: 'prod',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['pr', 'prodtime', 'income'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: false,
	idlemafia: true,
	privacy: 'public',

	initialize(items) {
		letterarray = items.arrays.letterarray;
		return 'Idle Mafia letter array loaded';
	},

	execute(message, args) {

		if (args.length < 2) return message.channel.send(tongue.says(message, chapterTitle, 'noargument'));

		// timetype will give the calculation mode : if the income is per second 'persec', per minute 'permin', per 15 second 'per15sec'
		let timetype = 'persec';
		let min;

		let firstbasenumber = args.shift();
		firstbasenumber = firstbasenumber.replace(',', '.');

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(parseFloat(firstbasenumber).toString().length !== firstbasenumber.length) {
			args.unshift(firstbasenumber.slice(parseFloat(firstbasenumber).toString().length - firstbasenumber.length));
			firstbasenumber = firstbasenumber.slice(0, parseFloat(firstbasenumber).toString().length);
		}

		let firstletter = '';
		let secondarg = args.shift();
		if (secondarg.length === 1) secondarg = secondarg.toLowerCase();
		if (letterarray.includes(secondarg)) {
			firstletter = secondarg;
		}

		let secondbasenumber;
		if (firstletter === '') {
			secondbasenumber = secondarg;
		}
		else {
			secondbasenumber = args.shift();
		}
		secondbasenumber = secondbasenumber.replace(',', '.');

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(parseFloat(secondbasenumber).toString().length !== secondbasenumber.length) {
			args.unshift(secondbasenumber.slice(parseFloat(secondbasenumber).toString().length - secondbasenumber.length));
			secondbasenumber = secondbasenumber.slice(0, parseFloat(secondbasenumber).toString().length);
		}

		let secondletter = '';
		secondarg = '';
		if (args.length) secondarg = args.shift();
		if (secondarg.length === 1) secondarg = secondarg.toLowerCase();
		if (letterarray.includes(secondarg)) secondletter = secondarg;

		// check if the datas provided are in a proper format
		if (isNaN(parseFloat(firstbasenumber)) || isNaN(parseFloat(secondbasenumber)) || !letterarray.includes(firstletter) || !letterarray.includes(secondletter)) {
			return message.channel.send(tongue.says(message, chapterTitle, 'wrongdata'));
		}

		if (args.length > 0) {
			min = args.shift().toLowerCase();
			if (min === 'cigar' || min === 'min' || min === 'cig') timetype = 'permin';
			if (min === '15' || min === '15s' || min === '15sec') timetype = 'per15sec';
			if (min === 'hours' || min === 'hrs' || min === 'h') timetype = 'hours';
		}


		// at this point there are four variables :
		//		firstbasenumber and secondbasenumber, which are the base numbers with possible decimal, but without any letter
		//		firstletter and secondletter, which are the possible letters after the base numbers
		// those variables will give 2 number for the calculation

		const firstnumber = render.tonumber(firstbasenumber, firstletter);
		const secondnumber = render.tonumber(secondbasenumber, secondletter);

		if (firstletter.length === 1) firstletter = firstletter.toUpperCase();
		if (secondletter.length === 1) secondletter = secondletter.toUpperCase();


		let commandwish = 'timeprod';
		let objective = '';

		if (timetype === 'hours' || (Number(firstnumber) < 240 && Number(secondnumber) > 15000) || (Number(secondnumber) < 240 && Number(firstnumber) > 15000)) commandwish = 'income';

		let timeprod;
		let timeprodsec;

		if (commandwish === 'income') {
			let incomeobjective = '';
			let incomeobjectivepersec = '';

			let timedisplay;
			let hours;
			let minutes;
			let timeparameter;
			if (Number(firstnumber) < Number(secondnumber)) {
				timeparameter = firstnumber;
			}
			else {
				timeparameter = secondnumber;
			}

			if (timetype === 'hours') {
				hours = parseInt(timeparameter);
				if (parseInt(timeparameter.length) !== timeparameter.length) minutes = Number(timeparameter.slice(timeparameter.indexOf('.')));
				if (minutes > 60) {
					hours = hours + Math.floor(minutes / 60);
					minutes = minutes - (Math.floor(minutes / 60) * 60);
				}
			}
			else {
				minutes = parseInt(timeparameter);
				if (minutes > 60) {
					hours = Math.floor(minutes / 60);
					minutes = minutes - (Math.floor(minutes / 60) * 60);
				}
			}

			if (hours > 0 && minutes > 0) {
				timedisplay = `${hours}${tongue.says('', locationTitle, 'hours').replace('\n', '')} ${minutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			}
			else if (hours > 0) {
				timedisplay = `${hours}${tongue.says('', locationTitle, 'hours').replace('\n', '')}`;
			}
			else {
				timedisplay = `${minutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			}

			if (Number(firstnumber) < Number(secondnumber)) {
				if (timetype === 'hours' && parseInt(firstnumber).toString().length === firstnumber.length) {
					timeprod = parseInt(firstnumber) * 60 * 3;
					timeprodsec = timeprod * 60;
				}
				else if (timetype === 'hours' && parseInt(firstnumber).toString().length !== firstnumber.length) {
					timeprod = parseInt(firstnumber) * 60 + parseInt(firstnumber.slice(0, parseInt(firstnumber).toString().length)) / 3;
					timeprodsec = timeprod * 60;
				}
				else {
					timeprod = parseInt(firstnumber) * 3;
					timeprodsec = timeprod * 60;
				}
				incomeobjectivepersec = render.toletter((Number(secondnumber) / timeprodsec).toFixed(3));
				incomeobjective = render.toletter((Number(secondnumber) / timeprod).toFixed(3));
				objective = `${secondbasenumber}${secondletter}`;
				const custom = {
					incomeobjectivepersec : incomeobjectivepersec,
					incomeobjective : incomeobjective,
					objective : objective,
					timedisplay : timedisplay,
				};
				return message.channel.send(tongue.says(message, chapterTitle, 'income', custom));
			}
			else {
				if (timetype === 'hours' && parseInt(secondnumber).toString().length === secondnumber.length) {
					timeprod = parseInt(secondnumber) * 60 * 3;
					timeprodsec = timeprod * 60;
				}
				else if (timetype === 'hours' && parseInt(secondnumber).toString().length !== secondnumber.length) {
					timeprod = parseInt(secondnumber) * 60 * 3 + parseInt(secondnumber.slice(0, parseInt(secondnumber).toString().length));
					timeprodsec = timeprod * 60;
				}
				else {
					timeprod = parseInt(secondnumber);
					timeprodsec = timeprod * 60 * 3;
				}
				incomeobjectivepersec = render.toletter((Number(firstnumber) / timeprodsec).toFixed(3));
				incomeobjective = render.toletter((Number(firstnumber) / timeprod).toFixed(3));
				objective = `${firstbasenumber}${firstletter}`;
				const custom = {
					incomeobjectivepersec : incomeobjectivepersec,
					incomeobjective : incomeobjective,
					objective : objective,
					timedisplay : timedisplay,
				};
				return message.channel.send(tongue.says(message, chapterTitle, 'income', custom));
			}
		}


		let minutes = 0;
		let idleminutes = 0;
		let hours = 0;
		let idlehours = 0;

		// if timeprod < is 0, then the second number is lower than the first one, so the first one is the objective to reach.
		timeprod = Number(secondnumber) / Number(firstnumber);
		if(timeprod < 1) timeprod = 1 / timeprod;
		if (timetype === 'permin') timeprod = timeprod * 60;
		if (timetype === 'per15sec') timeprod = timeprod * 15;

		let idletimeprod = timeprod / 3;

		if ((timeprod / 3600) > 0) hours = Math.floor(timeprod / 3600);
		timeprod = timeprod - (hours * 3600);
		minutes = Math.floor(timeprod / 60);


		if ((idletimeprod / 3600) > 0) idlehours = Math.floor(idletimeprod / 3600);
		idletimeprod = idletimeprod - (idlehours * 3600);
		idleminutes = Math.floor(idletimeprod / 60);

		let timeneeded;
		const idletimeneeded = {
			time : '0',
			diff : 'none',
		};
		let production = '';

		if (hours < 1 && minutes < 1) {
			return message.channel.send(tongue.says(message, chapterTitle, 'already'));
		}
		else if (idlehours > 200) {
			const time = 200;
			const custom = { time : time };
			return message.channel.send(tongue.says(message, chapterTitle, 'morethan', custom));
		}
		else if (hours < 1) {
			if (idleminutes < 11) idletimeneeded.diff = 'veryeasytime';
			if (idleminutes > 10 && idleminutes < 21) idletimeneeded.diff = 'easytime';
			if (idleminutes > 20) idletimeneeded.diff = 'middletime';
			timeneeded = `${minutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			idletimeneeded.time = `${idleminutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			if ((Number(secondnumber) / Number(firstnumber)) < 1) {
				production = `${secondbasenumber} ${secondletter} ${tongue.says('', locationTitle, timetype).replace('\n', '')}`;
				objective = `${firstbasenumber}${firstletter}`;
			}
			else {
				production = `${firstbasenumber} ${firstletter} ${tongue.says('', locationTitle, timetype).replace('\n', '')}`;
				objective = `${secondbasenumber}${secondletter}`;
			}
			const custom = {
				production : production,
				idletimeneeded : idletimeneeded.time,
				timeneeded : timeneeded,
				objective : objective,
			};
			return message.channel.send(tongue.says(message, chapterTitle, `${idletimeneeded.diff}`, custom));
		}
		else {
			if (idlehours < 1 && idleminutes > 19) idletimeneeded.diff = 'middletime';
			if (idlehours >= 1 && idlehours < 2) idletimeneeded.diff = 'hardtime';
			if (idlehours >= 2 && idlehours < 6) idletimeneeded.diff = 'veryhardtime';
			if (idlehours >= 6 && idlehours < 11) idletimeneeded.diff = 'sleeptime';
			if (idlehours >= 11) idletimeneeded.diff = 'helltime';
			timeneeded = `${hours}${tongue.says('', locationTitle, 'hours').replace('\n', '')} ${minutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			idletimeneeded.time = `${idlehours}${tongue.says('', locationTitle, 'hours').replace('\n', '')} ${idleminutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			if (idlehours < 1) idletimeneeded.time = `${idleminutes}${tongue.says('', locationTitle, 'min').replace('\n', '')}`;
			if ((Number(secondnumber) / Number(firstnumber)) < 1) {
				production = `${secondbasenumber} ${secondletter} ${tongue.says('', locationTitle, timetype).replace('\n', '')}`;
				objective = `${firstbasenumber}${firstletter}`;
			}
			else {
				production = `${firstbasenumber} ${firstletter} ${tongue.says(message, locationTitle, timetype).replace('\n', '')}`;
				objective = `${secondbasenumber}${secondletter}`;
			}
			const custom = {
				production : production,
				idletimeneeded : idletimeneeded.time,
				timeneeded : timeneeded,
				objective : objective,
			};
			return message.channel.send(tongue.says(message, chapterTitle, `${idletimeneeded.diff}`, custom));
		}
	},
};
