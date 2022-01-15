import { WebSocket } from 'ws'
import { readDatabase } from '../database.js'
import { send, sendError } from '../util.js'

interface AnalyseGameData
{
	type: 'analyse-game'
	gameID: string
}

/**
 * Handles a client's request to analyse a game.
 * The client will be sent the game.
 * @param { AnalyseGameData } data The client's request.
 * @param { WebSocket } ws The client's WebSocket.
 */
export const analyseGame = async (data: AnalyseGameData, ws: WebSocket) =>
{
	// Handle missing fields.

	if (data.gameID == null)
	{
		sendError(ws, 'Missing "gameID" field.')
		return
	}

	// Get the game.

	const game = (await readDatabase(entry => entry.id == data.gameID))[0]

	if (game == null)
	{
		sendError(ws, 'Invalid game ID')
		return
	}

	// Send the game to the player.

	send(ws, { type: 'game', game })
}