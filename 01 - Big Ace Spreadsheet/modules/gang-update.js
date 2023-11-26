// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');
// gsheetlink is composed with several functions : 	getSheet that gives you datas from a spreadsheet,
//																									collectDatas that gives you specified datas from a spreadhseet
//																									updateSheet that allows you to update a spreadsheet
//																									updateValues that allows you to update values in a spreadsheet
//																									appendValues that will add datas at the end of a spreadsheet
const gsheetlink = require ('../../modules/api-gsheet.js');

async function check(message, args, client) {

	// create the constant guildid depending on the guild where the message was sent
	// this gives the guild id used to get all the members
	const guildid = message.client.data.aceserverID;
	const guild = client.guilds.cache.get(guildid);

	// create the sheet specification to authentificate with the API
	// warning sheetrequest must be reset each time after usage
	function sheetrequest() {
		this.spreadsheetId = `${message.client.data.trackingspreadsheet}`;
	}
	function playersheetrequest() {
		this.spreadsheetId = `${message.client.data.trackingplayersspreadsheet}`;
	}

	// function to get all the discord member of a specified role (roleiid), return an array of members
	async function getdiscordmembers(roleid) {

		try {
			const response = await guild.roles.cache.get(roleid).members;
			return response;
		}
		catch (err) {
			return ('problem creating list: ' + err);
		}
	}

	// check if the spreadsheet is updated
	// return a message
	let messagechecksheet = '';
	// create the array guildmember that will contain all the discord members
	const guildmembers = [];
	const roletitle = message.client.data.roletrackarray.map(row => row[0]);
	// fill the array will all the discord user for each role tracked
	for (const role of message.client.data.roletrackarray) {
		guildmembers.push([]);
		const rolediscordmemberlist = await getdiscordmembers(role[1]);
		guildmembers[roletitle.indexOf(role[0])].push(role[0]);
		guildmembers[roletitle.indexOf(role[0])].push(rolediscordmemberlist);
	}

	// get the tracking spreadsheet and create the list of all the sheets
	const firstsheetrequest = new sheetrequest;
	const tracksheet = await gsheetlink.getSheet(firstsheetrequest);
	const sheetlist = [];
	tracksheet.sheets.forEach(sheet => {
		sheetlist.push(sheet.properties.title);
	});

	// check if there are sheets missing in the tracking spreadsheet
	const sheettoadd = [];
	guildmembers.forEach(title => {
		if (!sheetlist.includes(title[0])) sheettoadd.push(title[0]);
	});
	// if some sheets where missing create them in the spreadsheet
	if (sheettoadd.length) {
		const requests = [];

		sheettoadd.forEach(sheet => {
			requests.push({
				'addSheet': {
					'properties': {
						'title': sheet,
					},
				},
			});
		});
		const initialsheetrequest = new sheetrequest;
		initialsheetrequest.resource = { requests };
		const mess = await gsheetlink.updateSheet(initialsheetrequest);
		delete initialsheetrequest.resource;
		messagechecksheet += `${mess}\n`;

		// for the sheets created, fill the firsts cells with datas
		const requestupdate = new sheetrequest;
		requestupdate.resource = {
			valueInputOption: 'RAW',
			data: [],
		};
		sheettoadd.forEach(sheet => {
			requestupdate.resource.data.push({
				range: `${sheet}!A1:D`,
				values: [['discordID', 'discordName', 'inGameName', 'sheetID'], ['empty', 'empty', 'empty', 'empty']],
			});
		});
		const messupdate = await gsheetlink.updateValues(requestupdate);
		delete requestupdate.resource;
		messagechecksheet += `${messupdate} in the global spreadsheet\n`;
	}

	// get the list of all the players in the spreadsheet (return discord Id)
	const sheetmembers = [];
	let rolemembersheetid = [];
	for (const role of message.client.data.roletrackarray) {
		const membersrequest = new sheetrequest;
		membersrequest.range = `${role[0]}!A2:D`;
		const rolememberlist = await gsheetlink.collectDatas(membersrequest);
		delete membersrequest.range;
		if (typeof rolememberlist !== 'undefined') {
			const rolememberlistid = rolememberlist.map(row => row[0]);
			const rolememberlistname = rolememberlist.map(row => row[1]);
			const rolememberingamename = rolememberlist.map(row => row[2]);
			rolemembersheetid = rolememberlist.map(row => row[3]);
			sheetmembers.push([role[0]]);
			sheetmembers[roletitle.indexOf(role[0])].push(rolememberlistid);
			sheetmembers[roletitle.indexOf(role[0])].push(rolememberlistname);
			sheetmembers[roletitle.indexOf(role[0])].push(rolememberingamename);
			sheetmembers[roletitle.indexOf(role[0])].push(rolemembersheetid);
		}
	}
	const sheetmemberstitle = sheetmembers.map(row => row[0]);
	const guildtotalmembers = [];
	const memberstoadd = [];
	const memberstodelete = [];
	const memberstorename = [];
	let sheetidreference = 2;
	if (rolemembersheetid.length) {
		rolemembersheetid.forEach(number => {
			if (Number(number) >= sheetidreference) sheetidreference = Number(number) + 1;
		});
	}

	// make the list of the players to delete, the players to add and the players to rename
	guildmembers.forEach((role, i) => {
		memberstoadd.push([role[0]]);
		memberstoadd[i].push([]);
		memberstodelete.push([role[0]]);
		memberstodelete[i].push([]);
		memberstorename.push([role[0]]);
		memberstorename[i].push([]);
		const rolemembersid = [];
		role[1].forEach(member => {
			rolemembersid.push(member.user.id);
		});
		guildmembers[i][1].forEach(member => {
			guildtotalmembers.push(member.user.id);
			if (!sheetmembers[sheetmemberstitle.indexOf(role[0])][1].includes(member.user.id)) {
				memberstoadd[i][1].push([member.user.id, member.user.username, member.displayName, sheetidreference]);
				sheetidreference += 1;
			}
			else if (sheetmembers[sheetmemberstitle.indexOf(role[0])][4][sheetmembers[sheetmemberstitle.indexOf(role[0])][1].indexOf(member.user.id)] !== member.displayName || sheetmembers[sheetmemberstitle.indexOf(role[0])][2][sheetmembers[sheetmemberstitle.indexOf(role[0])][1].indexOf(member.user.id)] !== member.user.username) {
				memberstorename[i][1].push([member.user.id, member.user.username, member.displayName]);
			}
		});
		sheetmembers[sheetmemberstitle.indexOf(role[0])][1].forEach(member => {
			if (!rolemembersid.includes(member)) memberstodelete[i][1].push(member);
		});
		memberstodelete[i][1] = memberstodelete[i][1].reverse();
	});

	// change the sheetidreference for players in several gangs
	const guildtotaluniquemembers = [...new Set(guildtotalmembers)];
	let duplicatemembers = guildtotalmembers;
	if (guildtotaluniquemembers.length !== guildtotalmembers.length) {
		guildtotaluniquemembers.forEach(id => {
			const i = duplicatemembers.indexOf(id);
			duplicatemembers = duplicatemembers
				.slice(0, i)
				.concat(duplicatemembers.slice(i + 1, duplicatemembers.length));
		});
		duplicatemembers.forEach(duplicatemember => {
			let sheetid = 0;
			memberstoadd.forEach(role => {
				if (role[1].length) {
					role[1].forEach(member =>{
						if (member[0] == duplicatemember && sheetid === 0) {
							sheetid = member[3];
						}
						else if (member[0] == duplicatemember && sheetid !== 0) {
							member[3] = sheetid;
						}
					});
				}
			});
		});
	}


	// take the id and title of each sheet in the spreadsheet, sheet id are needed to delete complete rows
	const secondsheetrequest = new sheetrequest;
	const secondtracksheet = await gsheetlink.getSheet(secondsheetrequest);
	const sheetids = [];
	const sheettitle = [];
	secondtracksheet.sheets.forEach(sheet => {
		if (roletitle.includes(sheet.properties.title)) {
			sheettitle.push(sheet.properties.title);
			sheetids.push(sheet.properties.sheetId);
		}
	});

	// create the request to change names
	const renamerequests = new sheetrequest;
	for (const role of memberstorename) {
		if (role[1].length) {
			renamerequests.resource = {
				valueInputOption: 'RAW',
			};
			const individualrequests = [];
			role[1].forEach(member => {
				individualrequests.push({
					range: `${role[0]}!A${sheetmembers[sheettitle.indexOf(role[0])][1].indexOf(member[0]) + 2}:C${sheetmembers[sheettitle.indexOf(role[0])][1].indexOf(member[0]) + 2}`,
					values: [member],
				});
			});
			renamerequests.resource.data = individualrequests;
			// update members names to the spreadsheet
			if (individualrequests.length) {
				const addmess = await gsheetlink.updateValues(renamerequests);
				delete renamerequests.resource;
				messagechecksheet += `${addmess} in ${role[0]}\n`;
			}
		}
		else {
			messagechecksheet += `all gang names are updated in ${role[0]}\n`;
		}
	}
	// create the request to delete members
	const deleterequests = [];
	memberstodelete.forEach(role => {
		role[1].forEach(member => {
			deleterequests.push({
				'deleteDimension': {
					'range': {
						'sheetId': sheetids[sheettitle.indexOf(role[0])],
						'dimension': 'ROWS',
						'startIndex': sheetmembers[sheettitle.indexOf(role[0])][1].indexOf(member) + 1,
						'endIndex': sheetmembers[sheettitle.indexOf(role[0])][1].indexOf(member) + 2,
					},
				},
			});
		});
	});
	const deletesheetrequest = new sheetrequest;
	let requests = deleterequests;
	deletesheetrequest.resource = { requests };
	// delete members from the list
	if (deleterequests.length) {
		const mess = await gsheetlink.updateSheet(deletesheetrequest);
		delete deletesheetrequest.ressource;
		messagechecksheet += `${mess}, those ones were not in the family anymore\n`;
	}
	else {
		messagechecksheet += 'no member departure registered\n';
	}
	// create the request to add members
	const addrequest = new sheetrequest;

	for (const role of memberstoadd) {
		const addlist = [];
		role[1].forEach(member => {
			addlist.push(member);
		});
		addrequest.valueInputOption = 'RAW';
		addrequest.range = `${role[0]}!A2:C`;
		addrequest.insertDataOption = 'INSERT_ROWS';
		addrequest.resource = {
			range: `${role[0]}!A2:C`,
			values: addlist,
		};
		// add members ids + names to the spreadsheet
		if (addlist.length) {
			const addmess = await gsheetlink.appendValues(addrequest);
			messagechecksheet += `${addmess.updates.updatedRows} data added, those ones are new members in ${role[0]}\n`;
		}
		else {
			messagechecksheet += `no new member registered in ${role[0]}\n`;
		}
		delete addrequest.valueInputOption;
		delete addrequest.range;
		delete addrequest.insertDataOption;
		delete addrequest.ressource;
	}

	// Players individual sheets checking

	// get the updated list of all the players in the spreadsheet (return discord Id and sheet Id)
	const sheetmembersupdated = [];
	for (const role of message.client.data.roletrackarray) {
		const membersrequest = new sheetrequest;
		membersrequest.range = `${role[0]}!A2:D`;
		const rolememberlist = await gsheetlink.collectDatas(membersrequest);
		delete membersrequest.range;
		if (typeof rolememberlist !== 'undefined') {
			rolemembersheetid = rolememberlist.map(row => row[3]);
			sheetmembersupdated.push([role[0], []]);
			rolememberlist.forEach(member => {
				sheetmembersupdated[roletitle.indexOf(role[0])][1].push(member);
			});
		}
	}

	// get the players tracking spreadsheet and create the list of all the sheets
	const firstplayersheetrequest = new playersheetrequest;
	const playerstracksheet = await gsheetlink.getSheet(firstplayersheetrequest);
	const playerssheetlist = [[], []];
	playerstracksheet.sheets.forEach(sheet => {
		playerssheetlist[0].push(sheet.properties.sheetId);
		playerssheetlist[1].push(sheet.properties.title);
	});

	const guildmembercomplete = [[], [], [], []];
	sheetmembersupdated.forEach(role => {
		role[1].forEach(member => {
			guildmembercomplete[0].push(member[3]);
			guildmembercomplete[1].push(member[1]);
			guildmembercomplete[2].push(member[2]);
			guildmembercomplete[3].push(member[0]);
		});
	});

	// make the list of the players's sheets to delete, to add and to rename
	const playersheettoadd = [];
	const playersheettodelete = [];
	const playersheettorename = [];

	// delete the duplicate members
	const guilduniquememberID = [...new Set(guildmembercomplete[3])];
	let duplicatesheetmembers = guildmembercomplete[3];
	if (guilduniquememberID.length !== guildmembercomplete[3].length) {
		guilduniquememberID.forEach(id => {
			const i = duplicatesheetmembers.indexOf(id);
			duplicatesheetmembers = duplicatesheetmembers
				.slice(0, i)
				.concat(duplicatesheetmembers.slice(i + 1, duplicatesheetmembers.length));
		});
		duplicatesheetmembers.forEach(duplicatemember => {
			let original = 0;
			guildmembercomplete[3].forEach(member => {
				if (member == duplicatemember && original === 0) {
					original = 1;
				}
				else if (member == duplicatemember && original !== 0) {
					guildmembercomplete[0].splice(guildmembercomplete[3].indexOf(member), 1);
					guildmembercomplete[1].splice(guildmembercomplete[3].indexOf(member), 1);
					guildmembercomplete[2].splice(guildmembercomplete[3].indexOf(member), 1);
					guildmembercomplete[3].splice(guildmembercomplete[3].indexOf(member), 1);
				}
			});
		});
	}

	// get the member to rename list
	const playerstorename = [];
	memberstorename.forEach(role => {
		if (role[1].length) {
			role[1].forEach(member => {
				console.log(member);
				playerstorename.push(member[0]);
			});
		}
	});

	guildmembercomplete[0].forEach(member => {
		if (!playerssheetlist[0].includes(Number(member))) {
			playersheettoadd.push([member, guildmembercomplete[1][guildmembercomplete[0].indexOf(member)], guildmembercomplete[2][guildmembercomplete[0].indexOf(member)], guildmembercomplete[3][guildmembercomplete[0].indexOf(member)]]);
		}
		else if (playerstorename.length && playerstorename.includes(guildmembercomplete[3][guildmembercomplete[0].indexOf(member)])) {
			playersheettorename.push([member, guildmembercomplete[1][guildmembercomplete[0].indexOf(member)], guildmembercomplete[2][guildmembercomplete[0].indexOf(member)]]);
		}
	});

	playerssheetlist[0].forEach(member => {
		if (member !== 0 && !guildmembercomplete[0].includes(member.toString())) playersheettodelete.push(member.toString());
	});

	// create the request to create new player sheets
	if (playersheettoadd.length) {

		const playersheetaddrequest = new playersheetrequest;
		requests = [];
		const playersheetwriterequest = new playersheetrequest;
		playersheetwriterequest.resource = {
			valueInputOption: 'RAW',
			data: [],
		};

		playersheettoadd.forEach(sheet => {
			requests.push({
				'addSheet': {
					'properties': {
						'title': sheet[1],
						'sheetId': sheet[0],
						'gridProperties': {
							'rowCount': 100,
							'columnCount': 20,
						},
					},
				},
			});

			// for the sheets created, fill the firsts cells with datas
			playersheetwriterequest.resource.data.push({
				range: `${sheet[1]}!A1:D`,
				values: [['discordID', sheet[3], 'sheetID', sheet[0]], ['discordname', sheet[1]], ['in game name', sheet[2]]],
			});
			playersheetwriterequest.resource.data.push({
				range: `${sheet[1]}!A5:C`,
				values: [['Family Bonus'], ['Italian', 'Mexican', 'Japanese'], [0, 0, 0]],
			});
			playersheetwriterequest.resource.data.push({
				range: `${sheet[1]}!A9:H`,
				values: [['CAPOS'], ['Nickname', 'Level', 'Stars', 'Weapon', 'Armor', 'Ring', 'Necklace', 'Talents']],
			});
		});

		playersheetaddrequest.resource = { requests };
		const mess = await gsheetlink.updateSheet(playersheetaddrequest);
		delete playersheetaddrequest.resource;
		messagechecksheet += `${mess}\n`;

		const messupdate = await gsheetlink.updateValues(playersheetwriterequest);
		delete playersheetwriterequest.resource;
		messagechecksheet += `${messupdate} in the players spreadsheets\n`;
	}

	// create the request to rename the sheets
	if (playersheettorename.length) {

		const playersheetrenamerequest = new playersheetrequest;
		const playerrenamerequests = [];
		const playersheetwriterequest = new playersheetrequest;
		playersheetwriterequest.resource = {
			valueInputOption: 'RAW',
			data: [],
		};

		playersheettorename.forEach(sheet => {
			playerrenamerequests.push({
				'updateSheetProperties': {
					'properties': {
						'title': sheet[1],
						'sheetId': sheet[0],
					},
					'fields': 'title',
				},
			});

			// for the sheets renamed, change the name in the sheet
			playersheetwriterequest.resource.data.push({
				range: `${sheet[1]}!B2:B3`,
				values: [[sheet[1]], [sheet[2]]],
			});
		});

		requests = playerrenamerequests;

		playersheetrenamerequest.resource = { requests };
		const mess = await gsheetlink.updateSheet(playersheetrenamerequest);
		delete playersheetrenamerequest.resource;
		messagechecksheet += `${mess}\n`;

		const messupdate = await gsheetlink.updateValues(playersheetwriterequest);
		delete playersheetwriterequest.resource;
		messagechecksheet += `${messupdate} in the players spreadsheets\n`;
	}

	// create the request to delete the sheets
	if (playersheettodelete.length) {

		const playersheetdeleterequest = new playersheetrequest;
		const playerdeleterequests = [];

		playersheettodelete.forEach(sheet => {
			playerdeleterequests.push({
				'deleteSheet':{
					'sheetId': sheet,
				},
			});
		});

		requests = playerdeleterequests;

		playersheetdeleterequest.resource = { requests };
		const mess = await gsheetlink.updateSheet(playersheetdeleterequest);
		delete playersheetdeleterequest.resource;
		messagechecksheet += `${mess}\n`;
	}

	const custom = {
		text : messagechecksheet,
	};

	message.channel.send(tongue.says(message, 'admin', 'gangupdatefirst'));
	message.channel.send(tongue.says(message, 'admin', 'gangupdatechecksheet', custom));
	return 'finish';
}

exports.check = check;
