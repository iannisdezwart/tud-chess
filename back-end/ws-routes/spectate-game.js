import { games } from '../Game.js'
import { sendError } from '../util.js'

/**
 * Handles a client's request to spectate a game.
 * The client will be subscribed to the game's updates.
 * @param data The client's request.
 * @param ws The client's WebSocket.
 */
export const spectateGame = (data, ws) =>
{
	// Handle missing fields.

	if (data.gameID == null)
	{
		sendError(ws, 'Missing "gameID" field.')
		return
	}

	// Get the game object.

	const game = games.get(data.gameID)

	if (game == null)
	{
		sendError(ws, 'Invalid game ID')
		return
	}

	// Subscribe the player to receive updates from the game.

	game.subscribers.add(ws)

	// Send the current game state to the player.

	game.sendGameState(ws)
}