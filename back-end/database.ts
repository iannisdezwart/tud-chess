import * as fs from 'fs'
import readline from 'readline'

interface DatabaseEntry
{
	id: string
	whiteUsername: string
	blackUsername: string
	moves: Move[]
	dateTime: number
	winner: Colour
}

const DB_FILE = 'db.jsonl'

if (!fs.existsSync(DB_FILE))
{
	console.log('Creating database file...')
	fs.writeFileSync(DB_FILE, '')
}

// Keep track of the number of past games.

export const numberOfPastGames = fs.readFileSync(DB_FILE, 'utf8').split('\n').length

export const readDatabase = async (
	filter: (entry: DatabaseEntry) => boolean = () => true) =>
{
	const stream = fs.createReadStream(DB_FILE)

	const rl = readline.createInterface({
		input: stream,
		crlfDelay: Infinity
	})

	const entries: DatabaseEntry[] = []

	for await (const line of rl)
	{
		const entry = JSON.parse(line) as DatabaseEntry

		if (filter(entry))
		{
			entries.push(entry)
		}
	}

	return entries
}

export const addToDatabase = (entry: DatabaseEntry) =>
{
	fs.appendFileSync(DB_FILE, JSON.stringify(entry) + '\n')
}