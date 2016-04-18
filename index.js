var vorpal = require('vorpal')()
var colors = require('colors')
var fs = require('fs')

var storage = {}
try {
  var rawStorage = JSON.parse(fs.readFileSync('db.json'))
  storage.points = rawStorage.points || 0
  storage.history = rawStorage.history || []
  storage.streaks = rawStorage.streaks || {}
  storage.acts = {}
  Object.keys(rawStorage.acts).forEach(act => define(act, rawStorage.acts[act]))
} catch (e) {
  storage = {
    points: 0,
    acts: {},
    history: [],
    streaks: {}
  }
}

function persist () {
  fs.writeFileSync('db.json', JSON.stringify(storage))
}

function points (act) {
  return storage.acts[act]
}

function redraw () {
  var points = '(' + storage.points + ')'
  var dollar = '$'
  vorpal
    .delimiter('karma ' + points.blue + ' ' + dollar.bold)
}

function addHistory (name, points, times) {
  storage.history.push({ name, points, times, date: Date.now() })
  persist()
}

function makeAction (name, diff) {
  return function action (args, callback) {
    var times = args.times || 1
    storage.points += diff * times
    addHistory(name, diff, times)
    persist()
    redraw()
    callback()
  }
}

function define (name, points) {
  var isNew = !storage.acts.hasOwnProperty(name)

  storage.acts[name] = points
  persist()

  if (!isNew) vorpal.find('do ' + name).remove()
  vorpal
    .command('do ' + name + ' [times]')
    .description('Execute if you\'ve done `' + name + '` (you can also just type `' + name + '`)')
    .alias(name)
    .action(makeAction(name, points))
}

vorpal
  .command('def <name> <points>')
  .description('Defines an activity and points for it')
  .alias('define')
  .alias('d')
  .option('-n, --negative', 'subtract points instead of adding')
  .action(function (args, callback) {
    var points = args.options.negative ? -args.points : args.points
    define(args.name, points)
    this.log('successfully defined activity `' + args.name + '` (' + points + ' points)')
    callback()
  })

vorpal
  .command('list')
  .description('List activites and points')
  .alias('l')
  .action(function (args, callback) {
    this.log()
    Object.keys(storage.acts).forEach(act => this.log('  ' + act + ': ' + points(act)))
    this.log()
    callback()
  })

vorpal
  .command('history')
  .description('Show history of activities and points')
  .alias('h')
  .action(function (args, callback) {
    this.log()
    var highestNum = { points: 0, times: 0, name: 0 }
    storage.history.forEach(h => {
      if (Math.abs(h.points) > highestNum.points) highestNum.points = Math.abs(h.points)
      if (Math.abs(h.times) > highestNum.times) highestNum.times = Math.abs(h.times)
      if (h.name.length > highestNum.name) highestNum.name = h.name.length
    })

    var maxLength = {
      points: String(highestNum.points).length,
      times: String(highestNum.times).length,
      name: highestNum.name
    }
    storage.history.forEach(h => {
      var prefix = h.points > 0 ? '+' : ''
      var curLength = {
	points: String(Math.abs(h.points)).length,
	times: String(Math.abs(h.times)).length,
	name: h.name.length
      }
      prefix = ' '.repeat(maxLength.points - curLength.points) + prefix
      var timesPrefix = ' '.repeat(maxLength.times - curLength.times)
      var msg = '  ' + prefix + h.points + ' * ' + timesPrefix + h.times + ' (' + h.name + ')'
      var datePrefix = '  ' + ' '.repeat(maxLength.name - curLength.name)
      this.log((h.points > 0 ? msg.green : msg.red) + datePrefix + (new Date(h.date)).toString())
    })
    this.log('---' + '-'.repeat(maxLength.points) + '---' + '-'.repeat(maxLength.times) + '--' + '-'.repeat(maxLength.name) + '-')
    var endPrefix = storage.points > 0 ? '+' : ''
    var endMsg = '  ' + endPrefix + storage.points
    this.log(storage.points > 0 ? endMsg.green : endMsg.red)
    this.log()
    callback()
  })

// anti-habit streaks
function lastAction (habit, date) {
  const created = storage.streaks.hasOwnProperty(habit)
  storage.streaks[habit] = date
  persist()
  return created
}

function printActions () {
  if (!storage.streaks || storage.streaks.length)
    return "no streaks yet, use: action HABIT"

  const ONE_DAY = 1000 * 60 * 60 * 24

  const streaks = Object.keys(storage.streaks).map(k => {
    const lastAction = (new Date(storage.streaks[k])).getTime()
    const currentTime = (new Date(Date.now())).getTime()
    const days = Math.round(Math.abs(currentTime - lastAction) / ONE_DAY)
    return k + ': ' + '#'.repeat(days) + ' (' + days + ' days)'
  })

  return streaks.join('\n')
}

vorpal
  .command('action <habit>')
  .description('Starts a streak of not doing a certain habit')
  .alias('a')
  .action(function (args, callback) {
    const re = lastAction(args.habit, Date.now()) ? 're-' : ''
    this.log(re + 'started anti-habit streak `' + args.habit + '`')
    callback()
  })

vorpal
  .command('actions')
  .description('List anti-habit streaks')
  .alias('al')
  .action(function (args, callback) {
    this.log()
    this.log(printActions())
    this.log()
    callback()
  })


redraw()

vorpal
  .show()
