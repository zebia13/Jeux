const Discord = require('discord.js');
// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'meow';
const catTitle = 'catmeow';
const playerTitle = 'playermeow';

let catid;

module.exports = {
	name: 'meow',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['meow', 'meoow', 'mwew', 'meoow', 'meooow'],
	usage: tongue.says('', chapterTitle, 'description'),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'ace',
	guildOnly: true,

	initialize(items) {
		catid = items.ids.catid;
		return 'Cat ID loaded';
	},

	async execute(message, args) {

		if (!args.length && message.author.id === catid) return message.channel.send(tongue.says(message, chapterTitle, 'cat'));
		if (!args.length && message.author.id !== catid) message.channel.send(tongue.says(message, chapterTitle, 'nocat'));

		const commandcat = args.shift();

		const catmeow = tongue.language['ace'].chapter.get(catTitle).attributes;
		const playermeow = tongue.language['ace'].chapter.get(playerTitle).attributes;

		const catcommands = [];
		const playercommands = [];

		for (const command of catmeow.keys()) {
			if (command !== 'error') catcommands.push(command);
		}

		for (const command of playermeow.keys()) {
			if (command !== 'error') playercommands.push(command);
		}
		const playerRow = [];
		const messagePlayerRow = [];
		playercommands.forEach(command => {
			const button = new Discord.MessageButton();
			button.setCustomId(command);
			button.setLabel(command);
			button.setStyle('SECONDARY');
			playerRow.push(button);
		});
		while (playerRow[0] !== undefined) {
			let i = 0;
			const row = new Discord.MessageActionRow();
			while (i < 5 && playerRow[0] !== undefined) {
				const button = playerRow.shift();
				row.addComponents(button);
				i++;
			}
			messagePlayerRow.push(row);
		}

		const custom = {
			player : message.author.username,
			cat : `<@${catid}>`,
			catmeow : catcommands.toString(),
			playermeow : playercommands.toString(),
		};

		if (message.mentions.users.size) {

			custom.player = message.mentions.users.first();

			if (message.author.id === catid && catmeow.has(commandcat)) {
				custom.cat = message.author.username;
				custom.player = message.mentions.users.first();
				return message.channel.send(tongue.says(message, catTitle, commandcat, custom));
			}
			else if (message.author.id === catid) {
				return message.channel.send(tongue.says(message, chapterTitle, 'taggedplayer', custom));
			}
			else {
				return message.channel.send(tongue.says(message, chapterTitle, 'taggedcat', custom));
			}
		}
		else if (commandcat === 'nothebest') {
			let saytocat = message.content;
			saytocat = saytocat.slice(saytocat.indexOf('nothebest') + 1 + commandcat.length);
			custom.text = saytocat;
			return message.channel.send(tongue.says(message, chapterTitle, 'nothebest', custom));
		}
		else if (commandcat === 'thebest') {
			let saytocat = message.content;
			saytocat = saytocat.slice(saytocat.indexOf('thebest') + 1 + commandcat.length);
			custom.text = saytocat;
			return message.channel.send(tongue.says(message, chapterTitle, 'thebest', custom));
		}
		else if (message.author.id !== catid && playermeow.has(commandcat)) {
			custom.player = message.author.username;
			return tongue.sendSplitMessage(message, tongue.says(message, playerTitle, commandcat, custom));
		}
		else if (message.author.id === catid) {
			return message.channel.send(tongue.says(message, catTitle, 'error', custom));
		}
		else {
			const text = tongue.says(message, playerTitle, 'error', custom);
			const mess = await message.channel.send({ content : text, components : messagePlayerRow });
			const filter = interaction => interaction.user.id !== catid;
			const collector = mess.createMessageComponentCollector({ filter : filter });
			collector.on('collect', async interaction => {
				collector.stop();
				const componentsArray = interaction.message.components;
				componentsArray.forEach(row => {
					row.components.forEach(button => {
						button.disabled = true;
					});
				});
				await interaction.update({ components : componentsArray });
				const commandcatbutton = interaction.customId;
				custom.player = interaction.user.username;
				return tongue.sendSplitMessage(message, tongue.says(message, playerTitle, commandcatbutton, custom));
			});
		}
	},
};
