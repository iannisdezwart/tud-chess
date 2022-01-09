import { WebSocket } from 'ws'
import { games } from '../Game.js'
import { send, sendError } from '../util.js'

interface PlayGameData
{
	type: 'play-game'
	gameID: string
	token: string
}

/**
 * Handles a client's request to start playing a game.
 * @param { PlayGameData } data The client's request.
 * @param { WebSocket } ws The client's WebSocket.
 */
export const playGame = (data: PlayGameData, ws: WebSocket) =>
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
		sendError(ws, 'Invalid game ID')
		return
	}

	// Authenticate the player.

	if (game.white.token != data.token && game.black.token != data.token)
	{
		sendError(ws, 'Invalid token')
		return
	}

	// Set the player's WebSocket so they are subscribed to receiving
	// updates from the game.

	if (game.white.token == data.token)
	{
		// Close any old connection.

		if (game.white.ws != null)
		{
			game.white.ws.close()
		}

		game.white.ws = ws
	}
	else
	{
		// Close any old connection.

		if (game.black.ws != null)
		{
			game.black.ws.close()
		}

		game.black.ws = ws
	}

	// Subscribe the player to receive updates from the game.

	game.subscribers.add(ws)

	// Send the current game state to the player.

	game.sendGameState(ws)
}