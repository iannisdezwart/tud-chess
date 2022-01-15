import WebSocket from 'ws'
import { games } from '../Game.js'
import { sendError } from '../util.js'

interface ResignData
{
	type: 'resign'
	gameID: string
	token: string
}

/**
 * Resigns a player from a game.
 */
export const resign = (data: ResignData, ws: WebSocket) =>
{
	// Handle missing fields.

	if (data.gameID == null)
	{
		sendError(ws, 'Missing "gameID" field.')
		return
	}

	if (data.token == null)
	{
		sendError(ws, 'Missing "token" field.')
		return
	}

	// Get the game object.

	const game = games.get(data.gameID)

	if (game == null)
	{
		sendError(ws, 'Invalid game ID.')
		return
	}

	// Check who the player is.

	if (game.black.token == data.token)
	{
		game.endGame(Colour.White, 'Black resigned.')
		return
	}
	else if (game.white.token == data.token)
	{
		game.endGame(Colour.Black, 'White resigned.')
		return
	}

	// Invalid token.

	sendError(ws, 'Invalid token.')
}