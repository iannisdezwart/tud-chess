import { games } from '../Game.js'
import { sendError } from '../util.js'

/**
 * Offers a draw for a player.
 */
export const offerDraw = (data, ws) =>
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
		game.offerDraw(Colour.White)
		return
	}
	else if (game.white.token == data.token)
	{
		game.offerDraw(Colour.Black)
		return
	}

	// Invalid token.

	sendError(ws, 'Invalid token.')
}