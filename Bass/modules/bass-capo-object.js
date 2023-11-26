// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require('../../modules/api-gsheet.js');
// function tongue.says(message, command, file, situation, option1, option2)

let spreadsheet;
let capofpsheetrequest;
let capobasesheetrequest;
let skillsheetrequest;
let gearbasesheetrequest;
let skillopening;
let skilltable;
const allcaposurname = [];
let capobaseinfoimport;

// funciton initialize launched at the beginning of the app to load all the capo datas
async function initialize(items) {
	spreadsheet = items.spreadsheets.spreadsheet;
	// reference for the FP spreadhsheet
	capofpsheetrequest = {
		spreadsheetId:`${spreadsheet}`,
		range:'capo-fp-hp!A2:F',
	};

	// reference for the capo basic data spreadsheet
	capobasesheetrequest = {
		spreadsheetId:`${spreadsheet}`,
		range:'capobaselist!A2:M',
	};

	// reference for the skill spreadsheet
	skillsheetrequest = {
		spreadsheetId:`${spreadsheet}`,
	};
	skillopening = 'caposkills!A1:S6';
	skilltable = 'caposkills!A10:X';

	// reference for the gear spreadsheet
	gearbasesheetrequest = {
		spreadsheetId:`${spreadsheet}`,
		range:'capogears!A2:H',
	};
	capobaseinfoimport = await collectbasecapodatas();
	capobaseinfo = [];
	for (let i = 0; i < capobaseinfoimport[0].length; i++) {
		capobaseinfo.push([]);
		capobaseinfoimport.forEach(item => {
			capobaseinfo[i].push(item[i]);
		});
	}
	capobaseinfoimport.forEach((row, i) => {
		allcaposurname.push(row[0]);
		allcaposurname.push(row[2].toLowerCase());
		allcaposurname.push(row[3].toLowerCase());
		if (row[12] !== undefined) {
			const additionalsurname = row[12].split(',');
			additionalsurname.forEach(surname => {
				allcaposurname.push(surname.toLowerCase());
			});
		}
		// add one cell in capo surname : '/'
		allcaposurname.push('/');
		allcaposurname.push(i);
	});
	capobaseinfo.push(capobaseinfoimport);
	capobaseinfo.push(allcaposurname);
	exports.capobaseinfo = capobaseinfo;
	collectbaseskilldatas().then (datas => {
		caposkillopening = [];
		const caposkilltype = [];
		caposkill = [[], [], [], [], [], [], []];
		datas[0].forEach((title, j) => {
			caposkilltype.push(datas[0][j][0]);
			caposkillopening.push([datas[0][j][0], []]);
			for (let i = 1; i < datas[0][j].length ; i++) {
				caposkillopening[j][1].push(title[i]);
			}
		});
		caposkillopening.push(caposkilltype);
		// construction of the skill table :[0] : skill typeof
		//																	[1] : skill name
		//																	[2] : skill trigger
		//																	[3] : skill opening reference
		//																	[4] : skill target
		//																	[5] : skill effect
		//																	[6] : power of the skill per level
		for (let i = 0; i < datas[1].length; i++) {
			caposkill[0].push(datas[1][i][0]);
			caposkill[1].push(datas[1][i][1]);
			caposkill[2].push(datas[1][i][2]);
			caposkill[3].push(datas[1][i][3]);
			caposkill[4].push(datas[1][i][4]);
			caposkill[5].push(datas[1][i][5]);
			caposkill[6].push([]);
			for (let j = 6; j < datas[1][i].length; j++) {
				caposkill[6][i].push(datas[1][i][j]);
			}
		}
	});

// the gear table is not yet updated
	caposgeartable = await collectbasegeardatas();
	collectbaseFPDatas().then(datas => {
		datas[0].forEach((star, i) => {
			capostarmult[0].push(datas[0][i]);
			capostarmult[1].push(datas[1][i]);
		});
		datas[3].forEach((level, i) => {
			capofpbase[0].push(datas[2][i]);
			capofpbase[1].push(datas[3][i]);
		});
	});

	// build the capo icon and export them for the talking modules
	const capoemoji = await getEmoji();
	exports.capoemoji = capoemoji;
	return 'capo data collected';
}

// collecting capo datas
async function collectbaseFPDatas() {
	const response = await gsheetlink.collectDatas(capofpsheetrequest);
	return response;
}

async function collectbasecapodatas() {
	const response = await gsheetlink.collectDatas(capobasesheetrequest);
	return response;
}

async function collectbaseskilldatas() {
	const response = [[], []];
	skillsheetrequest.range = skillopening;
	response[0] = await gsheetlink.collectDatas(skillsheetrequest);
	skillsheetrequest.range = skilltable;
	response[1] = await gsheetlink.collectDatas(skillsheetrequest);
	return response;
}

async function collectbasegeardatas() {
	const response = await gsheetlink.collectDatas(gearbasesheetrequest);
	return response;
}

// build 2 array : capostarmult, with [0] : star level [1] : fp multiplier
// and capofpbase, with [0] : capo level [1] : base fp at this level
const capostarmult = [[], []];
const capofpbase = [[], []];

// capo base info is an array with all the basic capo data (nationality, names, trait, skill, etc...)
let capobaseinfo;
// capo skill opening cointain the skill level depending on the capo skill
let caposkillopening;
// caposkill cointain the data about each skill
let caposkill;
// capogeartable cointain the data about gears
let caposgeartable;

exports.initialize = initialize;
exports.getEmoji = getEmoji;
exports.getCapo = getCapo;
exports.Skill = Skill;
exports.Talent = Talent;
exports.Capo = Capo;

async function getEmoji() {
	const caposurnamelist = capobaseinfoimport.map (row => row[0]);
	const capoemojiid = capobaseinfoimport.map(row => row[11]);
	const capoimagelink = capobaseinfoimport.map(row => row[10]);
	const capolist = [caposurnamelist, capoemojiid, capoimagelink];
	return capolist;
}

async function getCapo(capo, skin) {
	return new Promise(function(resolve, reject) {
		if (typeof capo == undefined) reject ('capo is undefined');
		capo = capo.trim().toLowerCase();
		if (!allcaposurname.includes(capo)) {
			reject (`${capo} is not referenced in the capo list`);
		}
		const capoSliced = allcaposurname.slice(allcaposurname.indexOf(capo));
		let capoIndex = capoSliced.slice(capoSliced.indexOf('/'))[1];
		if (skin) capoIndex += 1;
		const returnedCapo = {
			surname : capobaseinfoimport[capoIndex][0],
			image : capobaseinfoimport[capoIndex][10],
			emoji : capobaseinfoimport[capoIndex][11],
		};
		resolve (returnedCapo);
	});
}

// Skill initialization, depends on the capo and the skill
function Skill(name, capolevel) {
	this.level = function() {
		const skilltype = caposkill[3][caposkill[1].indexOf(name)];
		let skilllevel;
		for (let i = 0; i < caposkillopening.length; i++) {
			if (caposkillopening[i][0] === skilltype) {
				for (let j = 0; j < caposkillopening[i][1].length; j++) {
					if (capolevel >= caposkillopening[i][1][j]) skilllevel = j;
				}
			}
		}
		return skilllevel;
	},
	this.levelmultiplier = caposkill[6][caposkill[1].indexOf(name)][this.level()];
	this.trigger = caposkill[2][caposkill[1].indexOf(name)];
	this.target = caposkill[4][caposkill[1].indexOf(name)];
	this.effect = caposkill[5][caposkill[1].indexOf(name)];
}

// Talents are not implemented yet
function Talent(hp, criticalhit, dodge, skilldamage, bossdamage, playerdamage, reduceskill, reducebossdamage, reduceplayerdamage, income, productiontime, upgradecost) {
	this.hp = hp;
	this.criticalhit = criticalhit;
	this.dodge = dodge;
	this.skilldamage = skilldamage;
	this.bossdamage = bossdamage;
	this.playerdamage = playerdamage;
	this.reduceskill = reduceskill;
	this.reducebossdamage = reducebossdamage;
	this.reduceplayerdamage = reduceplayerdamage;
	this.income = income;
	this.productiontime = productiontime;
	this.upgradecost = upgradecost;
}

// Capo constructor
function Capo(surname, level, stars, weapon, armor, ring, necklace, talent) {
	// identity are the basic property of the capo. Useless in fight
	this.identity = {
		name: capobaseinfo[2][capobaseinfo[0].indexOf(surname)],
		surname: capobaseinfo[3][capobaseinfo[0].indexOf(surname)],
		id: capobaseinfo[1][capobaseinfo[0].indexOf(surname)],
		nation: capobaseinfo[4][capobaseinfo[0].indexOf(surname)],
		trait: capobaseinfo[5][capobaseinfo[0].indexOf(surname)],
		avatar: capobaseinfo[10][capobaseinfo[0].indexOf(surname)],
		type: capobaseinfo[6][capobaseinfo[0].indexOf(surname)],
		building: capobaseinfo[9][capobaseinfo[0].indexOf(surname)],
	};
	this.level = level;
	this.stars = stars;
	// nationbonus is not updated with the capo constructor, it should be updated later
	this.nationbonus = 1;
	// talent properties contains all the datas from talent
//	this.talent = {
//		hp:talent.hp,
//		criticalhit:talent.criticalhit,
//		dodge:talent.dodge,
//		skilldamage:talent.skilldamage,
//		bossdamage:talent.bossdamage,
//		playerdamage:talent.playerdamage,
//		reduceskill:talent.reduceskill,
//		reducebossdamage:talent.reducebossdamage,
//		reduceplayerdamage:talent.reduceplayerdamage,
//		income:talent.income,
//		productiontime:talent.productiontime,
//		upgradecost:talent.upgradecost,
//	};
	// gear properties contain the gears of the capo
	this.gear = {
		// name, stars, level, effect
		weapon: [weapon[0], weapon[1], weapon[2], weapon[3], ''],
		armor: [armor[0], armor[1], armor[2], armor[3], ''],
		ring: [ring[0], ring[1], ring[2], ring[3], ''],
		necklace: [necklace[0], necklace[1], necklace[2], necklace[3], ''],
		fp: 0,
		hp: 0,
		statuts: [],
	};
	this.skill1 = new Skill(capobaseinfo[7][capobaseinfo[0].indexOf(surname)], this.level);
	this.skill2 = new Skill(capobaseinfo[8][capobaseinfo[0].indexOf(surname)], this.level);
	this.FP = {
		base: function() {
			const starmultiplier = capostarmult[1][capostarmult[0].indexOf(stars)];
			const basefp = capofpbase[1][capofpbase[0].indexOf(level)];
			return Number(starmultiplier) * Number(basefp);
		},
		gear: this.gear.fp,
	};
	this.HP = {
		base: (this.FP.base * 10) + 1,
		gear: this.gear.hp,
	};
	// All possible statuts : Shield, Support, Boost, Regen, etc...
	this.fight = {
		status: {
			support: {
				preventdeath: false,
				FPboost: 1,
				HPboost: 1,
				preventstun: [false, 0],
			},
			dead: false,
			stun: [false, 0],
			criticalhit: [],
		},
		fp: this.FP.base + this.FP.gear,
		hp: this.HP.base + this.HP.gear,
		hpMax: this.hp,
	};
}
