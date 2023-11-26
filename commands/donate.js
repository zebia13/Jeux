// function tongue.says(message,command,file,situation,option)
const tongue = require ('../modules/tongue.js');
const tell = require ('../modules/tell.js');
const paypal = require('../modules/api-paypal.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
//																									getDoc that will collect datas from a google document
const gsheetlink = require('../modules/api-gsheet.js');
let premiumspreadsheet;
let donatorSheetTitle;
let playerSheetTitle;
let amountbasic;
let currencybasic;
let ownerId;

const chapterTitle = 'donate';
const adminTitle = 'adm';

module.exports = {
	name : 'donate',
	description : tongue.says('', chapterTitle, 'description'),
	cooldown : 5,
	aliases : ['don', 'give'],
	usage : tongue.says('', chapterTitle, 'description'),
	help : true,
	core : true,
	privacy : 'public',
	guildOnly : false,

	// initialize function to set the bot premium spreadsheet with donators and premium users
	async initialize(items) {
		// get the prmium spreadsheet
		premiumspreadsheet = items.spreadsheets.premiumspreadsheet;
		const baseRequest = {
			spreadsheetId : premiumspreadsheet,
			range : 'index!A2:C',
		};
		const baseData = await gsheetlink.collectDatas(baseRequest);
		// extract the title of the donators and premium users
		const name = baseData.map(row => row[0]);
		const title = baseData.map(row => row[1]);
		donatorSheetTitle = title[name.indexOf('donators')];
		playerSheetTitle = title[name.indexOf('users')];
		// set the basic amount and currency
		amountbasic = items.paypal.paypalAmount;
		currencybasic = items.paypal.paypalCurrency;
		ownerId = items.ids.discordownerid;
		return `premium spreadsheet ID loaded, paypal default amount of ${amountbasic}${currencybasic} set `;
	},

	async execute(message, args) {

		// set the boolean to know if communication goes by DM or not, default is true
		let dmAuthor = true;
		const custom = { donator : message.author.username };
		let amount = amountbasic;
		let currency = currencybasic;

		// function to send DM message or channel message if DM are not possible
		async function sendMessage(text) {
			let messageSent;
			if (dmAuthor) {
				messageSent = await message.author.send(text)
					// if there is an error in trying a DM, set DM to false for next messages
					.catch(async error => {
						dmAuthor = false;
						custom.donator = message.author;
						console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
						messageSent = await message.channel.send(text);
					});
			}
			else {
				messageSent = await message.channel.send(text);
			}
			return messageSent;
		}

		// if specified amount in the command set the amount on user entry with 2 decimals
		if (args.length) {
			amount = parseFloat(args[0]).toFixed(2);
			// if the amount is not a number
			if (isNaN(amount)) {
				sendMessage(tongue.says(message, chapterTitle, 'wrongamount'));
				amount = '5.00';
			}
			// if the amount is under 1 euro set the amount on 1 euro
			else if (amount < 1) {
				sendMessage(tongue.says(message, chapterTitle, 'lessamount'));
				amount = '1.00';
			}
			else {
				amount = amount.toString();
			}
		}
		// change currency to currency symbol to display the symbol in bot message
		let currencySymbol = '';
		if (currency === 'EUR') {
			currencySymbol = '€';
		}

		// set the symbol on currency if there is no symbol available
		if (currencySymbol === '') currencySymbol = currency;

		custom.amount = amount;
		custom.currency = currencySymbol;

		async function launchOrder(cust) {
		// inform the user of the amount that will be given and ask for confirmation
			const messageSent = await sendMessage(tongue.says(message, chapterTitle, 'donateamount', cust));
			if (message.channel.type !== 'DM' && dmAuthor) {
				await message.channel.send(tongue.says(message, chapterTitle, 'infobydm'));
			}
			let answer;
			try {
				answer = await tell.buttonUser(messageSent, 20, message.author);
				if (answer === 'no') throw answer;
				if (answer !== 'yes') {
					sendMessage(tongue.says(message, chapterTitle, 'typeamount'));
					answer = await tell.askUser(message, 20, dmAuthor);
					amount = parseFloat(answer.slice(answer.search(/[0-9]/))).toFixed(2);
					if (isNaN(amount)) throw amount;
					if (answer.replace(/[^€$£]/g, '') !== '') {
						currencySymbol = answer.replace(/[^€$£]/g, '');
						if (currencySymbol === '€') currency = 'EUR';
						if (currencySymbol === '£') currency = 'GBP';
						if (currencySymbol === '$') currency = 'USD';
					}
					custom.amount = amount;
					custom.currency = currencySymbol;
				}
			}
			catch (e) {
				sendMessage(tongue.says(message, chapterTitle, 'stopdonate', custom));
				return 'stop';
			}
			return answer;
		}
		let payAnswer;
		while (payAnswer !== 'yes') {
			payAnswer = await launchOrder(custom);
			if (payAnswer === 'stop') return;
		}

		// donationGranted is a boolean to know if everything went well or not
		let donationGranted = false;

		const description = tongue.says(message, chapterTitle, 'donatedescription');
		const item = {
			name : tongue.says(message, chapterTitle, 'donatename').replace('\n', ''),
			unit_amount : {
				currency_code: currency,
				value : amount,
			},
			amount : {
				value: amount,
				currency_code : currency,
				breakdown : { item_total : { value: amount, currency_code : currency } },
			},
			quantity : 1,
			description : tongue.says(message, chapterTitle, 'donatedescription'),
			category : 'DONATION',
		};

		// create the paypal order for user validation
		const response = await paypal.createOrder(description, [item]);

		// send the validation link for the user
		custom.paypallink = `${response.links.approve}`;
		sendMessage(tongue.says(message, chapterTitle, 'paypalconnection', custom));

		// create 2 timers, one to end the donation process, one to check if donation has been authorized by the player
		const timeOut = setTimeout(endPaypal, 600000);
		const timeCheck = setInterval(checkPaypal, 1000);

		// function to check if the donation has been approved
		async function checkPaypal() {
			// get the info from the order
			const checkOrder = await paypal.getOrder(response.orderId);
			// check if the order has been approved by the player
			if (checkOrder.result.status === 'APPROVED') {
				// end the timers and put the result on granted
				donationGranted = true;
				clearInterval(timeCheck);
				clearTimeout(timeOut);
				// capture the paypal order to give the money to bot creator
				const capture = await paypal.captureOrder(response.orderId);
				// register the donateur in the spreadsheet
				const donateAddRequest = {
					spreadsheetId : `${premiumspreadsheet}`,
					valueInputOption : 'RAW',
					range : `${donatorSheetTitle}!A2:G`,
					insertDataOption : 'INSERT_ROWS',
					resource : {
						range: `${donatorSheetTitle}!A2:G`,
						values: [[capture.date, message.author.id, `${message.author.username}#${message.author.discriminator}`, capture.payer.name, capture.payer.email, capture.payer.address, capture.amount]],
					},
				};
				gsheetlink.appendValues(donateAddRequest);
				// send a message to the bot owner about the donation
				const user = await message.client.users.fetch(ownerId);
				custom.donatorID = message.author.id;
				custom.donatorName = `${message.author.username}#${message.author.discriminator}`;
				custom.amount = capture.amount;
				user.send(tongue.says(message, adminTitle, 'donateusermessage', custom));

				// collect the premium players datas
				const dataRequest = {
					spreadsheetId : `${premiumspreadsheet}`,
					range : `${playerSheetTitle}!A2:A`,
				};
				const premiumArray = await gsheetlink.collectDatas(dataRequest);
				// create an array of premium players discord ID
				const premiumId = [];
				premiumArray.forEach(row =>{
					premiumId.push(row[0]);
				});
				// if the player was not yet premium add the player in the spreadsheet
				if (!premiumId.includes(message.author.id)) {
					const premiumAddRequest = {
						spreadsheetId : `${premiumspreadsheet}`,
						valueInputOption : 'RAW',
						range : `${playerSheetTitle}!A2:D`,
						insertDataOption : 'INSERT_ROWS',
						resource : {
							range: `${playerSheetTitle}!A2:D`,
							values: [[message.author.id, `${message.author.username}#${message.author.discriminator}`, 'en']],
						},
					};
					gsheetlink.appendValues(premiumAddRequest);
				}
				else {
					console.log('player already premium');
				}
				// thanks the player for the donation
				if (message.channel.type !== 'DM' && dmAuthor) {
					message.channel.send(tongue.says(message, chapterTitle, 'useristhebest'));
				}
				return tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'granted'), true);
			}
		}
		// function if the donation timer end with no approved order
		function endPaypal() {
			// if the donation is granted thanks the player
			if (donationGranted) {
				return tongue.sendSplitMessage(message, tongue.says(message, chapterTitle, 'granted'), true);
			}
			else {
				return sendMessage(tongue.says(message, chapterTitle, 'stopdonate'));
			}
		}
	},
};
