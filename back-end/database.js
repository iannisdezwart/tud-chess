import * as fs from 'fs'
import readline from 'readline'

const DB_FILE = 'db.jsonl'

if (!fs.existsSync(DB_FILE))
{
	console.log('Creating database file...')
	fs.writeFileSync(DB_FILE, '')
}

// Keep track of the number of past games.

let numberOfPastGames = fs.readFileSync(DB_FILE, 'utf8').split('\n').length

/**
 * Returns the number of past games.
 * Used for retrieving statistics.
 */
export const getNumberOfPastGames = () => numberOfPastGames

/**
 * Reads all the past games from the database where `filter` returns true.
 */
export const readDatabase = async (
	filter = () => true) =>
{
	const stream = fs.createReadStream(DB_FILE)

	const rl = readline.createInterface({
		input: stream,
		crlfDelay: Infinity
	})

	// Create a list of entries, go through the stream and filter it.

	const entries = []

	for await (const line of rl)
	{
		const entry = JSON.parse(line)

		if (filter(entry))
		{
			entries.push(entry)
		}
	}

	return entries
}

/**
 * Writes a new game to the database.
 */
export const addToDatabase = entry =>
{
	fs.appendFileSync(DB_FILE, JSON.stringify(entry) + '\n')
	numberOfPastGames++
}