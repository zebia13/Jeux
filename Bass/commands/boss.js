// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'boss';

let bossid;

module.exports = {
	name: 'boss',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['godfather', 'godmother', 'leader', 'chief'],
	usage: tongue.says('', chapterTitle, 'usage'),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'ace',
	guildOnly: true,

	initialize(items) {
		bossid = items.ids.bossid;
		return 'Boss ID loaded';
	},

	execute(message, args) {

		if (!args.length && message.author.id === bossid) return message.channel.send(tongue.says(message, chapterTitle, 'boss'));
		if (!args.length && message.author.id !== bossid) return message.channel.send(tongue.says(message, chapterTitle, 'noboss'));

		const commandboss = args.shift();

		const custom = {
			boss : `<@${bossid}>`,
		};

		if (message.mentions.users.size) {
			const taggedUser = message.mentions.users.first();
			if (message.author.id === bossid) {
				custom.player = taggedUser;
				return message.channel.send(tongue.says(message, chapterTitle, 'taggedplayer', custom));
			}
			else if (taggedUser.id === bossid) {
				return message.channel.send(tongue.says(message, chapterTitle, 'taggedboss', custom));
			}
		}
		else if (commandboss === 'notheboss') {
			let say = message.content;
			say = say.slice(say.indexOf('notheboss') + 1 + commandboss.length);
			custom.text = say;
			return message.channel.send(tongue.says(message, chapterTitle, 'notheboss', custom));
		}
		else if (commandboss === 'theboss') {
			let say = message.content;
			say = say.slice(say.indexOf('theboss') + 1 + commandboss.length);
			custom.text = say;
			return message.channel.send(tongue.says(message, chapterTitle, 'theboss', custom));
		}
		else {
			custom.usage = tongue.says(message, chapterTitle, 'usage');
			return message.channel.send(tongue.says(message, chapterTitle, 'error', custom));
		}
	},
};
