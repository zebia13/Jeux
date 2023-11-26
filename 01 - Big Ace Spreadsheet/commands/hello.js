// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

const chapterTitle = 'hello';

module.exports = {
	name: 'hello',
	description: tongue.says('', chapterTitle, 'description'),
	cooldown: 5,
	aliases: ['hi'],
	usage: tongue.says('', chapterTitle, 'description'),
	help: true,
	social: true,
	idlemafia: false,
	privacy: 'public',
	guildOnly: true,


	execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, chapterTitle, 'hi'));
		if (!message.mentions.users.size) {
			return message.channel.send(tongue.says(message, chapterTitle, 'hi'));
		}
		else{
			const custom = {
				player : message.mentions.users.first(),
			};
			message.channel.send(tongue.says(message, chapterTitle, 'tagged', custom));
		}
	},
};
