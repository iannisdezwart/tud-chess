import { WebSocket } from 'ws'
import { games } from '../Game.js'
import { send, sendError } from '../util.js'

interface MoveData
{
	type: 'move'
	gameID: string
	token: string
	from: string
	to: string
}

/**
 * Handles a client's request to make a move.
 * @param { MoveData } data The client's request.
 * @param { WebSocket } ws The client's WebSocket.
 */
export const move = (data: MoveData, ws: WebSocket) =>
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

	if (data.from == null)
	{
		sendError(ws, 'Missing "from" field.')
		return
	}

	if (data.to == null)
	{
		sendError(ws, 'Missing "to" field.')
		return
	}

	// Get the game object.

	const game = games.get(data.gameID)

	if (game == null)
	{
		sendError(ws, 'Invalid game ID')
		return
	}

	// ...
}