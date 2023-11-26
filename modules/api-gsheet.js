const { google } = require('googleapis');
const Diacritics = require ('diacritic');

let gsclient;
let sheets;
let docs;
let doc;

let separatorStart;
let separatorEnd;
let formatorStart;
let formatorEnd;
let emojiorStart;
let emojiorEnd;

module.exports = {
	// function to get the connection with google project
	async link(gsheetkeys) {
		gsclient = new google.auth.JWT(gsheetkeys.client_email, null, gsheetkeys.private_key, ['https://www.googleapis.com/auth/drive']);
		sheets = google.sheets({ version: 'v4', auth : gsclient });
		docs = google.docs({ version: 'v1', auth : gsclient });
		async function autorize() {
			return new Promise (function(resolve, reject) {
			// connexion to google sheet
				gsclient.authorize(function(error) {
					if(error) {
						reject(error);
						return;
					}
					else {
						resolve('Connection to google api ok');
					}
				});
			});
		}
		const load = await autorize();
		return load;
	},

	// frunction to initialize the module and get the connection with google project
	async initialize(items) {
		separatorStart = items.formating.separatorStart;
		separatorEnd = items.formating.separatorEnd;
		formatorStart = items.formating.formatorStart;
		formatorEnd = items.formating.formatorEnd;
		emojiorStart = items.formating.emojiorStart;
		emojiorEnd = items.formating.emojiorEnd;
		return 'ready to read docs';
	},

	// function to get the whole spreadsheet with all data tracked
	async getSheet(grequest) {
		try {
			const response = (await sheets.spreadsheets.get(grequest)).data;
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to collect specific datas from the spreadsheet use sheetrequest in the parameters,
	// return an array of datas values
	async collectDatas(srequest) {
		try {
			const response = (await sheets.spreadsheets.values.get(srequest)).data.values;
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to update some data in the spreadsheet, use the sheetrequest in the parameters,
	// return a message if the function worked properly
	async updateSheet(updaterequest) {
		try {
			let response = await sheets.spreadsheets.batchUpdate(updaterequest);
			response = response.data.replies.length;
			if (response) response = (`${response} update request done`);
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to update some values in the spreadsheet, use the sheetrequest in the parameters,
	// return a message if the function worked properly
	async updateValues(updatevaluerequest) {
		try {
			let response = (await sheets.spreadsheets.values.batchUpdate(updatevaluerequest)).data;
			response = response.totalUpdatedRows;
			if (response) response = (`${response} data updated`);
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to add some values in the spreadsheet, use the sheetrequest in the parameters,
	// return a message if the function worked properly
	async appendValues(appendvaluerequest) {
		try {
			const response = (await sheets.spreadsheets.values.append(appendvaluerequest)).data;
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to collect the whole google document
	async getDoc(getdocrequest) {
		try {
			const response = (await docs.documents.get(getdocrequest));
			return response;
		}
		catch (err) {
			return ('The API returned an error: ' + err);
		}
	},

	// function to translate a doc into an usable array of data, returns an array of chapters
	// format will translate the doc in the proper format, accepts : discord.
	// the function works with a doc request
	async translateDoc(getdocrequest, format) {

		if (format == undefined) format = 'discord';

		doc = await this.getDoc(getdocrequest);

		if (typeof doc == String) return doc;

		// define the category for each format style of the google document
		const Chapter = 'HEADING_1';
		const Title = 'TITLE';
		const Author = 'SUBTITLE';
		const Summary = 'HEADING_2';
		const PlainText = 'NORMAL_TEXT';
		const Attributes = 'HEADING_3';
		const Items = 'HEADING_4';
		const Dice = 'HEADING_5';
		const Special = 'HEADING_6';
		const Emoji = 'SUBSCRIPT';
		const Custom = 'SUPERSCRIPT';
		const formator = {
			bold : 'bold',
			italic : 'italic',
			underline : 'underline',
			strikethrough : 'strikethrough',
			quote : 'quote',
		};

		// function to replace some characters of a text
		function charReplace(repcontent, char, newchar) {
			let finalcontent = '';
			if (repcontent.indexOf(char) > -1) {
				while (repcontent.indexOf(char) > -1) {
					finalcontent += repcontent.slice(0, repcontent.indexOf(char) + char.length).replace(char, newchar);
					repcontent = repcontent.slice(repcontent.indexOf(char) + char.length);
				}
			}
			finalcontent += repcontent;
			return finalcontent;
		}

		// function to translate a text in a proper discord formal, with markdown
		// to render emoji in a good way, they must be with in subscript format in the document
		function textFormat(content, textStyle) {
			// change the UPPERCASE + ENTER to be a simple linebreak
			content = charReplace(content, '\x0B', '\n');
			if (textStyle != undefined) {
				// a text with a baselineOffset format will keep the special characters, to use with emojis (subscript) or custom commands (superscript)
				if (!textStyle.baselineOffset) {
					content = charReplace(content, '*', '\\*');
					content = charReplace(content, '_', '\\_*');
					content = charReplace(content, '|', '\\|');
					content = charReplace(content, '~', '\\~');
					content = charReplace(content, '`', '\\`');
				}
				// a blank line with textStyle won't have any change
				if (content.replace('\n', '') != '') {
					// replace the custom text by the defined text in customText Object properties
					if (textStyle.baselineOffset === Custom) {
						content = content.replace(content.trim(), `${separatorStart}${content.trim()}${separatorEnd}`);
					}
					// put the text with a background color in a special console format `text` warning, no other formating is possible with console format.
					// extra spaces are added in the format
					if (textStyle.backgroundColor) {
						if (content.endsWith('\n')) {
							content = `${formatorStart}${formator.quote} ${content.slice(0, -1)} ${formator.quote}${formatorEnd}\n`;
						}
						else {
							content = `${formatorStart}${formator.quote} ${content} ${formator.quote}${formatorEnd}`;
						}
					}
					else if (!textStyle.backgroundColor) {
						if (textStyle.baselineOffset !== Emoji) {
							// put the bold text inside **text** to write it bold in discord.
							if (textStyle.bold) {
								if (content.trim().endsWith('\n')) {
									content = content.replace(content.trim(), `${formatorStart}${formator.bold}${content.trim().slice(0, -1)}${formator.bold}${formatorEnd}`);
								}
								else {
									content = content.replace(content.trim(), `${formatorStart}${formator.bold}${content.trim()}${formator.bold}${formatorEnd}`);
								}
							}
							// put the italic text inside *text* to write it italic in discord.
							if (textStyle.italic) {
								if (content.trim().endsWith('\n')) {
									content = content.replace(content.trim(), `${formatorStart}${formator.italic}${content.trim().slice(0, -1)}${formator.italic}${formatorEnd}`);
								}
								else {
									content = content.replace(content.trim(), `${formatorStart}${formator.italic}${content.trim()}${formator.italic}${formatorEnd}`);
								}
							}
							// put the undelined text inside __text__ to write it underlined in discord.
							if (textStyle.underline) {
								if (content.endsWith('\n')) {
									content = `${formatorStart}${formator.underline}${content.slice(0, -1)}${formator.underline}${formatorEnd}\n`;
								}
								else {
									content = `${formatorStart}${formator.underline}${content}${formator.underline}${formatorEnd}`;
								}
							}
							// put the strikethrough text inside ~~text~~ to write it bold in discord.
							if (textStyle.strikethrough) {
								if (content.endsWith('\n')) {
									content = `${formatorStart}${formator.strikethrough}${content.slice(0, -1)}${formator.strikethrough}${formatorEnd}\n`;
								}
								else {
									content = `${formatorStart}${formator.strikethrough}${content}${formator.strikethrough}${formatorEnd}`;
								}
							}
						}
						else {
							content = `${emojiorStart}${content.trim()}${emojiorEnd}`;
						}
					}
				}
			}
			return content;
		}

		// the extractText function will search in each part of the doc the text that was written in the google document
		// for inlineObject, it will only return the link of the object (use to display pictures).
		function extractText(toExtract, formatting) {
			let totalcontent = '';
			for (let j = 0; j < toExtract.length; j++) {
				if (toExtract[j].textRun != undefined) {
					const textStyle = toExtract[j].textRun.textStyle;
					let content = toExtract[j].textRun.content;
					if (formatting === 'discord') content = textFormat(content, textStyle);
					totalcontent += content;
				}
				if (toExtract[j].inlineObjectElement != undefined) {
					if (toExtract[j].inlineObjectElement.textStyle.link != undefined) {
						const content = toExtract[j].inlineObjectElement.textStyle.link.url;
						totalcontent += content;
					}
					else if (doc.data.inlineObjects[toExtract[j].inlineObjectElement.inlineObjectId].inlineObjectProperties.embeddedObject.title != undefined) {
						let content = doc.data.inlineObjects[toExtract[j].inlineObjectElement.inlineObjectId].inlineObjectProperties.embeddedObject.title;
						content = `${emojiorStart}${content.trim()}${emojiorEnd}`;
						totalcontent += content;
					}
					else {
						console.log(`warning, no URL or alt Title for inlineObject ${toExtract[j].inlineObjectElement.inlineObjectId} in ${doc.data.title}\ndocument ID : ${doc.data.documentId}`);
					}
				}
			}
			return totalcontent;
		}

		function cleanFormat(content) {
			// replace the formatting parts in proper discord parts
			// delete all possible bugs
			content = charReplace(content, `${formator.bold}${formatorEnd}${formatorStart}${formator.bold}`, '');
			content = charReplace(content, `${formator.italic}${formatorEnd}${formatorStart}${formator.italic}`, '');
			content = charReplace(content, `${formator.strikethrough}${formatorEnd}${formatorStart}${formator.strikethrough}`, '');
			content = charReplace(content, `${formator.quote}${formatorEnd}${formatorStart}${formator.quote}`, '');
			content = charReplace(content, `${formator.underline}${formatorEnd}${formatorStart}${formator.underline}`, '');
			content = charReplace(content, `${formator.bold}${formatorEnd}${formatorStart}${formator.italic}`, '** *');
			content = charReplace(content, `${formator.italic}${formatorEnd}${formatorStart}${formator.bold}`, '* **');
			// format the text for discord
			content = charReplace(content, `${formatorStart}${formator.bold}`, '**');
			content = charReplace(content, `${formator.bold}${formatorEnd}`, '**');
			content = charReplace(content, `${formatorStart}${formator.italic}`, '*');
			content = charReplace(content, `${formator.italic}${formatorEnd}`, '*');
			content = charReplace(content, `${formatorStart}${formator.underline}`, '__');
			content = charReplace(content, `${formator.underline}${formatorEnd}`, '__');
			content = charReplace(content, `${formatorStart}${formator.strikethrough}`, '~~');
			content = charReplace(content, `${formator.strikethrough}${formatorEnd}`, '~~');
			content = charReplace(content, `${formatorStart}${formator.quote}`, '`');
			content = charReplace(content, `${formator.quote}${formatorEnd}`, '`');
			return content;
		}

		// function to fill the array that contain all the doc elements with type of element (Chapter, Text, Author, etc...)
		// the command parameter is true if the text is not supposed to be displayed
		const textarray = [[], []];
		function fillDocArray(toExtract, type, command) {
			let formatting = format;
			let content;
			if (command) {
				formatting = 'command';
				content = extractText(toExtract, formatting);
				content = content.trim();
				content = Diacritics.clean(content);
				content = content.toLowerCase();
			}
			else {
				content = extractText(toExtract, formatting);
			}
			if (content) {
				textarray[0].push(content);
				textarray[1].push(type);
			}
		}

		for (let i = 0; i < doc.data.body.content.length; i++) {
			if (doc.data.body.content[i].paragraph != undefined) {
				// if the paragraph is a paragraph number
				if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Chapter) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Chapter', true);
				}
				// if the paragraph is a Title
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Title) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Title', false);
				}
				// if the paragraph is an author
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Author) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Author', false);
				}
				// if the paragraph is a summary
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Summary) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Summary', false);
				}
				// if the paragraph is an attribute action
				// the attribute section must appear at the beginning of the document, and it must change the customText object
				// the attribute section is used to search for equivalence and display specific text or commands
				// it check 3 parameter = ; > ; <
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Attributes) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Attributes', true);
				}
				// if the paragraph is a main text
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === PlainText) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'PlainText', false);
				}
				// if the paragraph is an item action
				// the item action is a way to change attributes it has 3 parameter = to set + to add - to retrieve
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Items) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Items', true);
				}
				// if the paragraph is a dice action
				// a dice action can lead to change the items, but also to lead to a specific Chapter
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Dice) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Dice', true);
				}
				// if the paragraph is a special paragraph
				else if (doc.data.body.content[i].paragraph.paragraphStyle.namedStyleType === Special) {
					fillDocArray(doc.data.body.content[i].paragraph.elements, 'Special', false);
				}
			}
			// special rendering for table : column 1 and 2 are command column, 0 and 4 are supposed to be displayed
			else if (doc.data.body.content[i].table != undefined) {
				const contenttable = [];
				for (let j = 0; j < doc.data.body.content[i].table.tableRows.length; j++) {
					const contenttablerow = [];
					for (let k = 0; k < doc.data.body.content[i].table.tableRows[j].tableCells.length; k++) {
						let totalcontent = '';
						for (let l = 0; l < doc.data.body.content[i].table.tableRows[j].tableCells[k].content.length; l++) {
							if (doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph != undefined) {
								for (let m = 0; m < doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements.length; m++) {
									if (doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement != undefined) {
										if (doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement.textStyle.link != undefined) {
											const content = doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement.textStyle.link.url;
											totalcontent += content;
										}
										else if (doc.data.inlineObjects[doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement.inlineObjectId].inlineObjectProperties.embeddedObject.title != undefined) {
											let content = doc.data.inlineObjects[doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement.inlineObjectId].inlineObjectProperties.embeddedObject.title;
											content = `${emojiorStart}${content.trim()}${emojiorEnd}`;
											totalcontent += content;
										}
										else {
											console.log(`warning, no URL or alt Title for inlineObject ${doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].inlineObjectElement.inlineObjectId} in ${doc.data.title}\ndocument ID : ${doc.data.documentId}`);
										}
									}
									if (doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].textRun != undefined) {
										const textStyle = doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].textRun.textStyle;
										let content = doc.data.body.content[i].table.tableRows[j].tableCells[k].content[l].paragraph.elements[m].textRun.content;
										let command = false;
										let formatting = format;
										if (doc.data.body.content[i].table.tableRows[j].tableCells[k].tableCellStyle.backgroundColor) {
											if (content === '\n' && doc.data.body.content[i].table.tableRows[j].tableCells[k].tableCellStyle.backgroundColor.color) {
												command = true;
												let red = Math.round(doc.data.body.content[i].table.tableRows[j].tableCells[k].tableCellStyle.backgroundColor.color.rgbColor.red * 255);
												if (isNaN(red)) red = 0;
												let green = Math.round(doc.data.body.content[i].table.tableRows[j].tableCells[k].tableCellStyle.backgroundColor.color.rgbColor.green * 255);
												if (isNaN(green)) green = 0;
												let blue = Math.round(doc.data.body.content[i].table.tableRows[j].tableCells[k].tableCellStyle.backgroundColor.color.rgbColor.blue * 255);
												if (isNaN(blue)) blue = 0;
												content = [red, green, blue];
											}
										}
										// cell formatting consider column 1 and 2 (starting at 0) as command content so lower case, with no formatting.
										if (k === 1 || k === 2) command = true;
										if (command) {
											formatting = 'command';
											content = charReplace(content, '\n', '');
											content = Diacritics.clean(content).toLowerCase();
										}
										if (formatting === 'discord') content = textFormat(content, textStyle);
										totalcontent += content;
									}
								}
							}
						}
						if (totalcontent.endsWith('\n')) totalcontent = totalcontent.slice(0, totalcontent.length - 1);
						contenttablerow.push(cleanFormat(totalcontent));
					}
					contenttable.push(contenttablerow);
				}
				textarray[0].push(contenttable);
				textarray[1].push('Command');
			}
		}

		const finalTextArray = [[], []];

		while (textarray[0].length) {
			const row = [textarray[0].shift(), textarray[1].shift()];
			if (row[1] === textarray[1] && textarray[1] !== 'Items') {
				const line = [textarray[0].shift(), textarray[1].shift()];
				// warning at the moment the max is two array nested
				if (typeof row[0] === Array) {
					row[0].forEach((col, i) => {
						if (typeof col[i] === Array) {
							col[i].forEach((cell, j) => {
								row[0][i][j].push(line[0][i][j]);
								j++;
							});
						}
						else {
							row[0][i].push(line[0][i]);
						}
						i++;
					});
				}
			}
			else {
				finalTextArray[0].push(row[0]);
				finalTextArray[1].push(row[1]);
			}
		}

		// creation processe for the return map
		// returnMap is a pair of (chapter, chaptercontent), if no chapter is defined at the beginning, the chapter is default
		// chapter is a string, it's the chapter number or text
		// chaptercontent is a map object map composed with pair of (attribute, attributecontent)
		// aatribute is an object with a function to check if the attribute is true or false, the default attribute is always true.

		let chapter = 'main';
		let attribute = 'main';

		// the attribute Content is an object, the check function work with the attribute key as attributeText, and the global userAttribute of the returnObject.user.attributes.actual
		// AttributeContent.check should put AttributeContent.true to the good state to read or not the AttributeContent.content
		function AttributeContent(name, summary, text, commands, items, dice, special) {
			this.name = name,
			this.check = function(attributeText, userAttribute) {
				if (attributeText.includes('=')) {
					const attributeToCheck = attributeText.slice(0, attributeText.indexOf('=')).trim();
					if (attributeText.slice(attributeText.indexOf('=') + 1).toLowerCase().includes('true') || attributeText.slice(attributeText.indexOf('=') + 1).toLowerCase().includes('oui')) {
						if (userAttribute[attributeToCheck]) {
							this.true = true;
						}
						else {
							this.true = false;
						}
					}
					else if (attributeText.slice(attributeText.indexOf('=') + 1).toLowerCase().includes('false') || attributeText.slice(attributeText.indexOf('=') + 1).toLowerCase().includes('non')) {
						if (!userAttribute[attributeToCheck]) {
							this.true = true;
						}
						else {
							this.true = false;
						}
					}
					else if (userAttribute[attributeToCheck]) {
						if(userAttribute[attributeToCheck].toString() == attributeText.slice(attributeText.indexOf('=') + 1).trim().toLowerCase()) {
							this.true = true;
						}
						else {
							this.true = false;
						}
					}
				}
				else if (attributeText.includes('>')) {
					const attributeToCheck = attributeText.slice(0, attributeText.indexOf('>')).trim();
					if (attributeToCheck > userAttribute[attributeText.slice(attributeText.indexOf('>') + 1).trim()]) {
						this.true = true;
					}
					else {
						this.true = false;
					}
				}
				else if (attributeText.includes('<')) {
					const attributeToCheck = attributeText.slice(0, attributeText.indexOf('<')).trim();
					if (attributeToCheck < userAttribute[attributeText.slice(attributeText.indexOf('<') + 1).trim()]) {
						this.true = true;
					}
					else {
						this.true = false;
					}
				}
				else {
					this.true = true;
				}
			},
			this.true = true,
			this.content = {
				summary : summary,
				text : text,
				commands : commands,
				items : {
					items,
					run : function(item, userAttribute) {
						if (item.includes('=')) {
							const attributeToChange = item.slice(0, item.indexOf('=')).trim();
							const attributeReference = item.slice(item.indexOf('=')).toLowerCase().trim();
							if (item.slice(item.indexOf('=') + 1).toLowerCase().includes('true') || item.slice(item.indexOf('=') + 1).toLowerCase().includes('oui')) {
								userAttribute[attributeToChange] = true;
							}
							else if (item.slice(item.indexOf('=') + 1).toLowerCase().includes('false') || item.slice(item.indexOf('=') + 1).toLowerCase().includes('non')) {
								userAttribute[attributeToChange] = false;
							}
							else if (userAttribute[attributeReference]) {
								userAttribute[attributeToChange] = userAttribute[attributeReference];
							}
							else {
								userAttribute[attributeToChange] = item.slice(item.indexOf('=')).toLowerCase().trim();
							}
						}
						else if (item.includes('+')) {
							const attributeToChange = item.slice(0, item.indexOf('+')).trim();
							const attributeReference = item.slice(item.indexOf('+')).toLowerCase().trim();
							if (isNaN(Number(userAttribute[attributeToChange]))) userAttribute[attributeToChange] = 0;
							userAttribute[attributeToChange] = Number(userAttribute[attributeToChange]);
							if (userAttribute[attributeReference]) {
								userAttribute[attributeToChange] += Number (userAttribute[attributeReference]);
							}
							else {
								userAttribute[attributeToChange] += Number(item.slice(item.indexOf('+') + 1).trim());
							}
						}
						else if (item.includes('-')) {
							const attributeToChange = item.slice(0, item.indexOf('-')).trim();
							const attributeReference = item.slice(item.indexOf('-')).toLowerCase().trim();
							if (isNaN(Number(userAttribute[attributeToChange]))) userAttribute[attributeToChange] = 0;
							userAttribute[attributeToChange] = Number(userAttribute[attributeToChange]);
							if (userAttribute[attributeReference]) {
								userAttribute[attributeToChange] -= Number (userAttribute[attributeReference]);
							}
							else {
								userAttribute[attributeToChange] -= Number(item.slice(item.indexOf('-') + 1).trim());
							}
						}
						else {
							console.log(`error with item : ${item}`);
						}
					},
				},
				dice : dice,
				special : special,
			};
		}

		function ChapterContent() {
			this.title = '';
			this.authors = [];
			this.summary = '';
			this.attributes = new Map([[attribute, new AttributeContent()]]);
		}

		const returnObject = {
			doc: {
				id: doc.data.documentId,
				title:doc.data.title,
			},
			title: '',
			authors: [],
			summary: '',
			attributes: {
				all: [],
			},
			items: {
				all: [],
			},
			special: [],
			user: {
				attributes:{
					start: {},
					actual: {},
				},
				way : [],
			},
			chapter: new Map([[chapter, new ChapterContent()]]),
		};

		let author = [];
		let summary = [];
		let text = [];
		let item = [];
		let dice = [];
		let special = [];
		let commands = new Map();

		// returnObject.chapter.set(chapter, chaptercontent)
		do {
			const chapterContent = new ChapterContent();
			if (finalTextArray[1][0] === 'Chapter') {
				const chapterRow = [finalTextArray[0].shift(), finalTextArray[1].shift()];
				chapter = chapterRow[0];
			}
			do {
				if (finalTextArray[1][0] === 'Attributes') {
					const attributeRow = [finalTextArray[0].shift(), finalTextArray[1].shift()];
					const attributes = attributeRow[0].replace(/ /g, '').split(/[^a-z0-9_-]/);
					returnObject.attributes.all.push([attributes[0], attributeRow[0]]);
					attribute = attributeRow[0];
				}
				do {
					const row = [finalTextArray[0].shift(), finalTextArray[1].shift()];
					if (row[1] === 'Title') {
						if (!returnObject.title) returnObject.title = row[0];
						if (!chapterContent.title) chapterContent.title = row[0];
					}
					if (row[1] === 'Author') {
						returnObject.authors.push(row[0]);
						chapterContent.authors.push(row[0]);
						author.push(row[0]);
					}
					if (row[1] === 'Summary') {
						if (!returnObject.summary) returnObject.summary = row[0];
						if (!chapterContent.summary) chapterContent.summary = row[0];
						summary.push(row[0]);
					}
					if (row[1] === 'PlainText') text.push(row[0]);
					if (row[1] === 'Command') {
						row[0].forEach(element => {
							commands.set(element[1], element);
						});
					}
					if (row[1] === 'Items') {
						const items = row[0].replace(/ /g, '').split(/[^a-z0-9_]/);
						returnObject.items.all.push([items[0], row[0]]);
						item.push(row[0]);
					}
					if (row[1] === 'Dice') {
						dice.push(row[0]);
					}
					if (row[1] === 'Special') {
						returnObject.special.push(row[0]);
						special.push(row[0]);
					}
				} while (!(finalTextArray[1][0] === 'Attributes' || finalTextArray[1][0] === 'Chapter') && finalTextArray[0].length > 0);
				const attributeContent = new AttributeContent(attribute, summary, text, commands, item, dice, special);
				chapterContent.attributes.set(attribute, attributeContent);
				attribute = 'main';
				author = [];
				summary = [];
				text = [];
				commands = new Map();
				item = [];
				dice = [];
				special = [];
			} while (finalTextArray[1][0] !== 'Chapter' && finalTextArray[0].length > 0);
			returnObject.chapter.set(chapter, chapterContent);
		} while (finalTextArray[0].length > 0);

		// make some changes in the object like organisaing the items, attributes, etc...
		returnObject.authors = [...new Set(returnObject.authors)].join(', ');
		returnObject.chapter.forEach((chap, chapkey) => {
			if (chap.authors.length) chap.authors = chap.authors.join(', ');
			chap.attributes.forEach((att, attkey) =>{
				if (att.content.items.items == undefined || att.content.items.items.length === 0) delete att.content.items;
				for (const property in att.content) {
					if (att.content[property] == undefined || att.content[property].length === 0) {
						delete att.content[property];
					}
				}
				if (Object.keys(att.content).length === 0) {
					chap.attributes.delete(attkey);
					if (!chap.attributes.size) returnObject.chapter.delete(chapkey);
				}
				else {
					if (att.content.text) {
						att.content.text = att.content.text.join('');
						// replace the formatting parts in proper discord parts
						// delete all possible bugs
						att.content.text = cleanFormat(att.content.text);
					}
					if (att.content.summary) {
						att.content.summary = att.content.summary.join('');
						// replace the formatting parts in proper discord parts
						// delete all possible bugs
						att.content.summary = cleanFormat(att.content.summary);
					}
				}
			});
		});
		if (!returnObject.attributes.all.length && !returnObject.items.all.length) {
			delete returnObject.attributes;
			delete returnObject.user.attributes;
			delete returnObject.items;
		}

		// return the Object with the whole doc in it, sorted by chapter
		return returnObject;
	},
};
