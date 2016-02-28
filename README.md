# karma

_manage activities with a points/karma system_

![https://i.imgur.com/9p9uWAu.png](https://i.imgur.com/9p9uWAu.png)


## Setup

Clone this repository:

```
git clone https://github.com/omnidan/karma
cd karma
```

Install dependencies (in the `karma` directory):

```
npm install
```


## Running

```
node index.js
```


## Commands

 * `help` - view all commands with infos
 * `help [command]` - view info about a certain command

 * `def <name> <points>` - define an activity
 * `def <name> <points> -n` - define an activity with negative points

 * `list` - list all activities
 * `history` - list a history of all activities

 * `<activity> [times]` or `do <activity> [times]` - do a certain activity certain times, e.g. `coding 60` could be "coding for 60 minutes"


## Resetting db

You can reset the db by running:

```
npm run reset
```

**WARNING:** This will remove all your data.

