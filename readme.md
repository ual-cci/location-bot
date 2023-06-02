<img src="https://github.com/ual-cci/location-bot/raw/main/_assets/location.png" height="150px" />

# Location Bot
Location Bot will quickly update your status to show which site you are at without having to change it manually in your profile.

- `/location [building]` – This sets the building location using a simple code, like "pr" for Peckham Road, or "hh" for High Holborn.
- `/location list` – This lists all locations and their codes and aliases.
- `/location clear` – This clears your current status.

If you want to add a new location please submit a pull request on GitHub.

## Adding a new location
Simply edit `locations.json` adding a new location with this format:

```
"code": {
	"emoji": "magic-wand",
	"text": "Working from Middle-earth",
	"alias": ["example", "demo"]
},
```

## API
There is a simple HTTP API for changing your location without going into Slack.

### API Keys

#### Create a key
You can only have one key, to create a key in Slack type `/location key new` and you'll be provided a UUID.

#### Recovery a key
If you've lost your key you can recover it by typing `/location key show`.

#### Removing a key
If you want to remove your key or create a new one first remove it by typing `/location key remove`.

### Using the API

#### Setting your location
The API uses the key as a Bearer Token as shown:

```
Authorization: Bearer {key}
````

You need to send a POST request to http://example.com:3000/api with the form data (x-www-form-urlencoded):

```
location: {code}
```

Successful (200) requests will get a JSON response from the API which include a status property explaining the outcome:

- Your are status has been cleared.
- Unknown location code.

An unknown location will come with a 406 error status and a JSON response with a status property:
- You are working from "{location text}" for the rest of the day.

If the token is invalid you will only get a 403 not authorised error and no JSON.

The only other valid status code is 500 Server Error.

#### Clearing your location
This is the same as setting but your location form data should be an empty string.

No form data or no location property will result in a 406 error.