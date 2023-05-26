<img src="https://github.com/ual-cci/location-bot/raw/main/_assets/location.png" height="150px" />

# Location Bot
This simple app will quickly update your status to show which site you are at without having to change it manually in your profile.

Simply type `/location` and then your building code, for example "pr" for Peckham Road and "hh" for High Holborn.

The app also supports common mistyped names like "lcc" for Elephant & Castle and "wimbledon" for Merton Hall Road.
You’ve added Location to this workspace.

## Adding a new location
Simply edit `locations.json` adding a new location with this format:

```
"code": {
	"emoji": "magic-wand",
	"text": "Working from Middle-earth",
	"alias": ["example", "demo"]
},
```