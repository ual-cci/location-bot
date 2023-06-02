const fs = require('fs');
const crypto = require('crypto');
const moment = require('moment');
require('dotenv-safe').config();

const express = require('express');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');

const app = express();
app.use(bodyParser.urlencoded());
app.use(bearerToken());

let keys = require('./apikeystore.json');

const locations = require('./locations.json');
const codes = compileCodes();
const locationList = buildLocationList();

const {App, LogLevel} = require('@slack/bolt');
const slack = new App({
	socketMode: true,
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	appToken: process.env.SLACK_APP_TOKEN
});

app.post('/api', (req, res) => {
	const uuids = Object.values(keys);
	const users = Object.keys(keys);
	const location = getStatus(req.body.location)
	if (location) {
		if (uuids.includes(req.token)) {
			try {
				_setStatus(users[uuids.indexOf(req.token)], location);
				res.json({
					location: location.text,
					status: `You are working from "${location.text}" for the rest of the day.`
				});
			}
			catch (error) {
				res.sendStatus(500);
			}
		} else {
			res.sendStatus(403)
		}
	} else if (req.body.location == '') {
		try {
			slack.client.users.profile.set({
				user: users[uuids.indexOf(req.token)],
				profile: {
					status_text: '',
					status_emoji: ''
				}
			});
			res.json({
				status: `Your status has been cleared.`
			});
		}
		catch (error) {
			res.sendStatus(500);
		}
	} else {
		res.status(406).json({
			status: `Unknown location code.`
		});
	}
})

app.listen(process.env.PORT);

(async () => {
	await slack.start();
	slack.command('/location', async({command, ack, respond}) => {
		// Acknowlege the command
		await ack();

		switch(command.text) {
			case 'key new':
				return createAPIKey(command, respond);
			case 'key remove':
				return removeAPIKey(command, respond);
			case 'key show':
				return showAPIKey(command, respond);
			case 'clear':
				return clearStatus(command, respond);
			case 'list':
				return listStatuses(command, respond);
			default:
				return setStatus(command, respond);
		}
	});	
})();

async function clearStatus(command, respond) {
	try {
		const result = await slack.client.users.profile.set({
			user: command.user_id,
			profile: {
				status_text: '',
				status_emoji: ''
			}
		});
		await respond({text:`:soap: Your status has been cleared.`});
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
			await _setStatus(command.user_id, location)
			await respond({text:`You are ":${location.emoji}: ${location.text}" for the rest of the day.`});
		}
		catch (error) {
			console.log(error);
		}
	} else {
		await respond({text:":warning: That location isn't configured yet, feel free to <https://github.com/ual-cci/location-bot|create a pull request>."});
	}
}

async function _setStatus(user_id, location) {
	await slack.client.users.profile.set({
		user: user_id,
		profile: {
			status_text: location.text,
			status_emoji: `:${location.emoji}:`,
			status_expiration: moment().endOf('day').unix()
		}
	});
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

function createAPIKey(command, respond) {
	if (keys[command.user_id]) {
		respond({text:':key: You already have an API key use `/location key show` to recover it.'});
	} else {
		keys[command.user_id] = crypto.randomUUID();
		respond({text:`:key: Your API key is: \`${keys[command.user_id]}\``});
		updateAPIKeyStore();
	}
}

function showAPIKey(command, respond) {
	if (keys[command.user_id]) {
		respond({text:`:key: Your API key is: \`${keys[command.user_id]}\``});
	} else {
		respond({text:`:key: You don't have an API key.`});
	}
}

function removeAPIKey(command, respond) {
	if (keys[command.user_id]) {
		delete keys[command.user_id];
		respond({text:':key: You has been removed.'});
		updateAPIKeyStore();
	} else {
		respond({text:`:key: You don't have an API key.`});
	}
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

function updateAPIKeyStore() {
	fs.writeFile('apikeystore.json', JSON.stringify(keys), (err) => {
		console.log(`API Key Store Updated`)
		if (err) console.log(err)
	})
}