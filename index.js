const Discord = require('discord.js')
const auth = require('./auth')
const dice = require('./dice')
const rollTable = require('./rollTable')
const macro = require('./macros')

const bot = new Discord.Client()

let macros
let effect

/**
 * Gets the words from the text delimited by spaces and returns the arguments
 *
 * @param {String} text - message content
 */
function parseArgs(text) {
	const args = text.split(' ').slice(1).join(' ')
	return args.match(/(?:[^\s"]+|"[^"]*")+/g)
}

/**
 * Gets the command from the text
 *
 * @param {String} text - message content
 */
function parseCommand(text) {
	if (text[0] === '!') {
		return text.slice(1).split(/ +/)[0]
	} else {
		return null
	}
}

/**
 * Sends a message to the author of the message that called the bot
 *
 * @param {Message} source - discord's Message object
 * @param {String} message - message to send in a dm
 */
function sendDirect(source, message) {
	source.author.createDM().then((dm) => {
		dm.send(message)
	})
}

/**
 * Bot listens for event in which a message is sent in the channel and reacts to commands
 * Commands:
 * def - adds a macro
 * macros - lists currently stored macros, a macro is used to define a roll to a string
 * undef - deletes a macro
 * roll - takes dice expression and performs the operation of rolling dice
 * bullshit - gets a random effect from the Net Libram of Random Magical Effects
 * madness - gets a random effect from either short/long term madness table
 *
 * @param {Message} msg - Discord's Message object
 */
bot.on('message', msg => {
	if(msg.author.id === bot.user.id) {
		return
	}

	const text = msg.content
	const command = parseCommand(text)
	const args = parseArgs(text)
	console.log(args)

	switch(command) {
	case 'def':
		if(args.length != 2) {
			msg.channel.send(`Macro definition requires exactly 2 arguments, found ${args.length}!`)
		} else {
			macro.addMacro(args[0], args[1], macros)
		}
		break
	case 'macros':
		msg.channel.send(JSON.stringify(macros))
		break
	case 'undef':
		if(args.length != 1) {
			msg.channel.send(`Undef requires exactly 1 argument, found ${args.length}!'`)
		} else {
			macro.undef(args[0], macros)
		}
		break
	case 'roll':
		try {
			const result = dice(args.join(' '))
			const out = result.sum + result.rolls.reduce((a, n) => a + n, 0)
			msg.channel.send(JSON.stringify(result))
			msg.channel.send(`You rolled ${out}`)
		} catch(err) {
			msg.channel.send(`Error: ${err}`)
		}
		break
	case 'bullshit':
		rollTable('tables/NLRMEv2.txt').then(effect => {
			if (args !== null && args.includes('secret')) {
				sendDirect(msg, `Effect: ${effect}`)
			} else {
				msg.channel.send(`Effect: ${effect}`)
			}
		})
		break
	case 'madness':
		if (args !== null) {
			if (args.includes('short')) {
				prm = rollTable('tables/short-madness.txt')
			} else if (args.includes('long')) {
				prm = rollTable('tables/long-madness.txt')
			} else {
				return
			}
			prm.then(effect => {
				if (args.includes('secret')) {
					sendDirect(msg, `Effect: ${effect}`)
				} else {
					msg.channel.send(`Effect: ${effect}`)
				}
			})
		}
		break
	default:
		msg.channel.send(`Unrecognized command \`${command}\``)
	}

	// console.log(msg.channel.name)
	// console.log(msg.content)
	msg.channel.send(macro.macroSub(text, macros))
})

/**
 * Bot connects and is able to react to information received from Discord
 * Loads the macros
 */
bot.on('ready', () => {
	console.log('Connected')
	macros = require('./macros.json')
	console.log('Loaded macros: ' + JSON.stringify(macros))
})

bot.login(auth.token)
