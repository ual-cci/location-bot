<img src="https://github.com/ual-cci/location-bot/raw/main/_assets/location.png" height="150px" />

# Location Bot
Location Bot will quickly update your status to show which site you are at without having to change it manually in your profile.

- `/location _[building]_` – This sets the building location using a simple code, like "pr" for Peckham Road, or "hh" for High Holborn.
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