const moment = require('moment')
require('dotenv-safe').config();

const locations = require('./locations.json');
const codes = compileCodes();
const locationList = buildLocationList();

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

		switch(command.text) {
			case 'clear':
				return clearStatus(command, respond);
			case 'list':
				return listStatuses(command, respond);
			case '':
			case undefined:
			case null:
				return helpText(command,respond);
			default:
				return setStatus(command, respond);
		}
	});	
})();

async function helpText(command,respond) {
	let response = {
		"blocks": [
			{
				"type": "header",
				"text": {
					"type": "plain_text",
					"text": "CCI Location Bot"
				}
			},
			{
				text: "Location Bot will quickly update your status to show which site you are at without having to change it manually in your profile."
			},
			{
				text: "Available commands:"
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "- `/location _[building]_` – This sets the building location using a simple code, like `pr` for Peckham Road, or `hh` for High Holborn."
				}
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "- `/location list` – This lists all locations and their codes and aliases."
				}
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "- `/location clear` – This clears your current status."
				}
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "- `/location` - No input will show a short help text."
				}
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "If you want to add a new location, or to file any bugfixes, please submit [a pull request on GitHub](https://github.com/ual-cci/location-bot/pulls)."
				}
			},
		]
	};
	await respond(response);
}

async function clearStatus(command, respond) {
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
}

async function listStatuses(command, respond) {
	try {
		await respond(locationList);
	}
	catch (error) {
		console.log(error);
	}
}

async function setStatus(command, respond) {
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
}

function compileCodes() {
	const output = {};
	Object.keys(locations).forEach((l, k) => {
		output[l] = l.toLowerCase().trim();
		if (locations[l].alias) {
			locations[l].alias.forEach((a, k) => {
				output[a] = l.toLowerCase().trim();
			});
		};
	});
	return output
}

function getStatus(c) {
	if (c == '') return console.log('No status defined');
	if (typeof c != "string") return console.log('Status no text');
	c = c.toLowerCase().trim();
	if (codes[c] == undefined) return console.log(`No such code exists: ${c}`);
	let code = codes[c];
	return locations[code];
}

function buildLocationList() {
	let response = {
		"blocks": [
			{
				"type": "header",
				"text": {
					"type": "plain_text",
					"text": "These are the available locations:"
				}
			}
		]
	};

	Object.keys(locations).forEach((l) => {
		const location = locations[l];
		let other_aliases = '';

		if (location.alias) {
			location.alias.forEach((a) => {
				other_aliases += ' `' + a + '`'
			})
		}

		response.blocks.push({
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `:${location.emoji}: ${location.text}` + ' – `' + l + '`' + other_aliases
			}
		});
	})
	response.blocks.push({
		"type": "context",
		"elements": [
			{
				"type": "mrkdwn",
				"text": `Feel free to <https://github.com/ual-cci/location-bot|create a pull request> if you can't find your preferred location.`
			}
		]
	});

	return response;
}
