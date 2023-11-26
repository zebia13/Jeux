// function tongue.says(message,command,file,situation,option)
const tongue = require ('../../modules/tongue.js');

module.exports = {
	name: 'hello',
	description: tongue.says('', 'hello', 'description'),
	cooldown: 5,
	aliases: ['hi', 'coucou', 'bonjour'],
	usage: tongue.says('', 'hello', 'description'),
	help: true,
	social: true,
	adventure: false,

	execute(message, args) {

		if (!args.length) return message.channel.send(tongue.says(message, 'hello', 'hi'));
		if (!message.mentions.users.size) {
			return message.channel.send(tongue.says(message, 'hello', 'hi'));
		}
		else{
			const custom = {
				taggedUser: message.mentions.users.first(),
			};
			message.channel.send(tongue.says(message, 'hello', 'tagged', custom));
		}

	},
};
