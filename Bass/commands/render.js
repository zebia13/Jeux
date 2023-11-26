// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const adminTitle = 'adm';
let letterarray;

module.exports = {
	name: 'render',
	description: 'translate tool for idle mafia, move from a real number to a number in im style (K,M,B,T,aa, etc...) with toletter, or from an idle mafia number to a real number.',
	usage: '[toletter] [the number you want to translate] or [tonumber] [the number you want to translate] [the letter]',
	cooldown: 5,
	help: false,
	pprivacy: 'premium',

	async initialize(items) {
		letterarray = items.arrays.letterarray;
		return 'letter array loaded';
	},


	tonumber(basenumber, lettertonumber) {
		// this function needs two arguments : basenumber which is the number before the letter and lettertonumber which contains the letter to translate
		// there is no verification of the letter, so they must be checked before calling the function
		if(typeof lettertonumber === 'undefined') lettertonumber = '';
		// if there is no letter, give back the base number
		if (!lettertonumber.length) return basenumber;

		// if the number provided has a format with , replace with .
		basenumber = basenumber.replace(',', '.');

		// calculate the number of 0 to add due to the letter
		let numbermultiplier = letterarray.indexOf(lettertonumber) * 3;
		let intnumber;
		let decimalnumber;

		// check if the basenumber has a decimal, and split the number into 2 part : the integer and the decimal
		if (basenumber.indexOf('.') > -1) {
			intnumber = basenumber.slice(0, basenumber.indexOf('.'));
			decimalnumber = basenumber.slice(basenumber.indexOf('.') + 1);
		}
		else {
			intnumber = basenumber;
			decimalnumber = '';
		}

		// calculate the length of the decimal part
		const decimalsize = decimalnumber.length;

		numbermultiplier = numbermultiplier - decimalsize;

		// if there is more decimal than the number of 0 to add, the resulting number will have some decimal
		if (numbermultiplier < 0) {
			decimalnumber = decimalnumber.slice(0, numbermultiplier) + '.' + decimalnumber.slice(numbermultiplier);
		}
		else{
			// add as many 0 as needed
			for (let i = 0; i < numbermultiplier; i++) {
				decimalnumber = decimalnumber + '0';
			}
		}
		// give back the number
		return intnumber + decimalnumber;
	},

	toletter(basenumber, lettertonumber) {
		// this function needs one argument : basenumber, it will be the number translated in a number + letter
		// if the number provided has a format with , replace with .
		basenumber = basenumber.replace(',', '.');
		if (basenumber.indexOf('e+') > -1) {
			let exponent = basenumber.slice(basenumber.indexOf('e+') + 2);
			basenumber = basenumber.slice(0, basenumber.indexOf('e+'));
			basenumber = basenumber.slice(0, 1) + basenumber.slice(2);
			exponent = Number(exponent) - (basenumber.length - 1);
			// add as many 0 as needed
			for (let i = 0; i < exponent; i++) {
				basenumber = basenumber + '0';
			}
		}

		// don't let the variable lettertonumber undefined
		if(typeof lettertonumber === 'undefined') lettertonumber = '';

		let intnumber;

		// check if basenumber is a decimal number, and create a variable with the integer part only
		if (basenumber.indexOf('.') > -1) {
			intnumber = basenumber.slice(0, basenumber.indexOf('.'));
		}
		else {
			intnumber = basenumber;
		}

		if (lettertonumber.length === 1) lettertonumber = lettertonumber.toLowerCase();
		// create a variable that will give the position of the corresponding letter in the array : letterarray, keep the length of the number for further calculations
		const numbersize = intnumber.length - 1;
		let posletterarray = Math.trunc(numbersize / 3) - 1;
		if (letterarray.includes(lettertonumber)) posletterarray = posletterarray + letterarray.indexOf(lettertonumber);
		let letter = letterarray[posletterarray + 1];

		// if the number is less than 1000 return the base number
		if (posletterarray < 0) return basenumber;

		// with 1 letter it will always be lower case, but the output should be uppercase
		if (letter.length === 1) letter = letter.toUpperCase();

		// the number separator will calculate the position of the . with the new letter format
		const numberseparator = numbersize - (posletterarray + 1) * 3 + 1;
		// to have a propoer rounded number, the function will take the first 7 number, and then add the . and round the decimal
		let number = basenumber.toString().slice(0, 7);
		number = number.slice(0, numberseparator) + '.' + number.slice(numberseparator);
		number = parseFloat(number).toFixed(2);
		number = number.toString().slice(0, 5);
		return number + ' ' + letter;
	},

	execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, adminTitle, 'nocommandrender'));

		const commandRender = args.shift().toLowerCase();

		if (commandRender !== 'tonumber' && commandRender !== 'toletter') return message.channel.send(tongue.says(message, adminTitle, 'nocommandrender'));
		if (!args.length) return message.channel.send(tongue.says(message, adminTitle, 'nodatarender'));

		// change the , into a . to avoid errors when transcripting into a number

		let basenumber = args.shift();
		basenumber = basenumber.replace(',', '.');

		// check if the data provided are in a proper format
		if (isNaN(parseFloat(basenumber)))return message.channel.send(tongue.says(message, adminTitle, 'wrongnumberrender'));

		// autochange a recognized format, like 45k instead of 45 k into a proper format
		if(commandRender === 'tonumber' && parseFloat(basenumber).toString().length !== basenumber.length) {
			args.unshift(basenumber.slice(parseFloat(basenumber).toString().length - basenumber.length));
			basenumber = basenumber.slice(0, parseFloat(basenumber).toString().length);
		}

		let lettertonumber;
		if (!args.length) {
			lettertonumber = '';
		}
		else{
			lettertonumber = args.shift();
		}

		if (lettertonumber.length === 1) lettertonumber = lettertonumber.toLowerCase();
		if (commandRender === 'tonumber' && !letterarray.includes(lettertonumber)) return message.channel.send(tongue.says(message, adminTitle, 'wrongletterrender'));

		// at this point there are three variables :
		//		commandRender, that admit tonumber or toletter
		//		basenumber, which is the base number with possible decimal, but without any letter
		//		lettertonumber, which is the possible letter after the base number


		if (commandRender === 'toletter') {
			const text = this.toletter(basenumber, lettertonumber);
			const basetext = `${basenumber} ${lettertonumber}`;
			const custom = {
				base : basetext,
				render : text,
			};
			return message.channel.send(tongue.says(message, adminTitle, 'toletterrender', custom));
		}

		if (commandRender === 'tonumber') {
			const text = this.tonumber(basenumber, lettertonumber);
			const basetext = `${basenumber} ${lettertonumber}`;
			const custom = {
				base : basetext,
				render : text,
			};
			return message.channel.send(tongue.says(message, adminTitle, 'tonumberrender', custom));
		}
	},
};
