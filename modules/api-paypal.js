const paypal = require('@paypal/checkout-server-sdk');

let paypalId;
let paypalSecret;
let brandName;
let environment;
let client;

// frunction to initialize the module and get the connection with paypal API
async function initialize(items) {
	paypalId = items.private.paypalId;
	paypalSecret = items.private.paypalSecret;
	brandName = items.paypal.brandName;
	// creating the paypal environment environment
	// use SandboxEnvironment to test, LiveEnvironment to use it for real
	environment = new paypal.core.LiveEnvironment(paypalId, paypalSecret);
	client = new paypal.core.PayPalHttpClient(environment);
	return 'paypal credentials created';
}

// function to create the paypal order
async function createOrder(description, items) {
	const request = new paypal.orders.OrdersCreateRequest();
	let totalAmount = 0;
	let currency;
	items.forEach(item => {
		currency = item.amount.currency_code;
		totalAmount += Number(item.amount.value);
	});
	totalAmount = totalAmount.toFixed(2).toString();
	// warning, amount MUST be a string toFixed(2)
	request.requestBody({
		intent : 'CAPTURE',
		application_context : {
			brand_name : brandName,
			locale : 'en-US',
			landing_page : 'LOGIN',
			shipping_preference : 'NO_SHIPPING',
			user_action : 'PAY_NOW',
		},
		purchase_units : [
			{
				description : description,
				amount : {
					currency_code: currency,
					value : totalAmount,
					breakdown : { item_total : { currency_code : currency, value : totalAmount } },
				},
				items : items,
			},
		],
	});
	// create the link object for user approval
	const link = {
		approve : '',
		self : '',
		capture : '',
	};
	// create the order with the API
	const response = await client.execute(request);
	response.result.links.forEach(linkObject => {
		if (linkObject.rel === 'approve') {
			link.approve = linkObject.href;
		}
		else if (linkObject.rel === 'self') {
			link.self = linkObject.href;
		}
		else if (linkObject.rel === 'capture') {
			link.capture = linkObject.href;
		}
	});
	// create the returned object .global with all the response datas, orderId with the identity of the order, links with the links for approval
	const orderResponse = {
		global : response,
		orderId : response.result.id,
		links : link,
	};
	return orderResponse;
}

// function to get and order by its ID and check its state
async function getOrder(orderId) {
	const request = new paypal.orders.OrdersGetRequest(orderId);
	const response = await client.execute(request);
	return response;
}

// function to get the money from an order after approval
async function captureOrder(orderId) {
	// create the capture order
	const request = new paypal.orders.OrdersCaptureRequest(orderId);
	request.requestBody({});
	const response = await client.execute(request);
	// create the response with infos about the donator to fill the spreadsheet
	const captureResponse = {
		total : response,
		date : response.headers.date,
		payer : {
			email : response.result.payer.email_address,
			name : `${response.result.payer.name.given_name} ${response.result.payer.name.surname}`,
			address : response.result.payer.address.country_code,
		},
		amount : `${response.result.purchase_units[0].payments.captures[0].amount.value} ${response.result.purchase_units[0].payments.captures[0].amount.currency_code}`,
	};
	return captureResponse;
}

exports.initialize = initialize;
exports.createOrder = createOrder;
exports.captureOrder = captureOrder;
exports.getOrder = getOrder;
