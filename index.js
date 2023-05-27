const moment = require('moment')
require('dotenv-safe').config();

const { App, LogLevel } = require('@slack/bolt');
const app = new App({
	socketMode: true,
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	appToken: process.env.SLACK_APP_TOKEN,
	// logLevel: LogLevel.DEBUG
});

(async () => {
	await app.start();
	app.command('/location', async({command, ack, respond}) => {
		// Acknowlege the command
		await ack();

		// If command.text is 'clear'
		if (command.text == 'clear') {
			try {
				const result = await app.client.users.profile.set({
					user: command.user_id,
					profile: {
						status_text: '',
						status_emoji: ''
					}
				});
				await respond({text:`:soap: You are status has been cleared.`});
			}
			catch (error) {
				console.log(error);
			}

			// Do not continue to execute function
			return;
		}
		
		// If the location is not 'clear'
		let location = getStatus(command.text)
		if (location) {
			try {
				const result = await app.client.users.profile.set({
					user: command.user_id,
					profile: {
						status_text: location.text,
						status_emoji: `:${location.emoji}:`,
						status_expiration: moment().endOf('day').unix()
					}
				});
				await respond({text:`You are ":${location.emoji}: ${location.text}" for the rest of the day.`});
			}
			catch (error) {
				console.log(error);
			}
		} else {
			await respond({text:":warning: That location isn't configured yet, feel free to <https://github.com/ual-cci/location-bot|create a pull request>."});
		}
	});	
})();

const locations = require('./locations.json');
let codes = {};

Object.keys(locations).forEach((l, k) => {
	codes[l] = l.toLowerCase().trim();
	if (locations[l].alias) {
		locations[l].alias.forEach((a, k) => {
			codes[a] = l.toLowerCase().trim();
		});
	};
});

function getStatus(c) {
	if (c == '') return console.log('No status defined');
	if (typeof c != "string") return console.log('Status no text');
	c = c.toLowerCase().trim();
	if (codes[c] == undefined) return console.log(`No such code exists: ${c}`);
	let code = codes[c];
	return locations[code];
}