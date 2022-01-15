import { games } from '../Game.js'
import { sendError } from '../util.js'

/**
 * Handles a client's request to make a move.
 * @param data The client's request.
 * @param ws The client's WebSocket.
 */
export const move = (data, ws) =>
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
		sendError(ws, 'Invalid game ID.')
		return
	}

	// Check if the move is legal.

	const from = new Square(data.from.x, data.from.y)
	const to = new Square(data.to.x, data.to.y)

	if (!game.board.isLegal(from.x, from.y, to.x, to.y))
	{
		sendError(ws, 'Illegal move.')
		return
	}

	// Validate the token.

	if (game.white.token != data.token && game.black.token != data.token)
	{
		sendError(ws, 'Invalid token.')
		return
	}

	// Ensure the player whose turn it is is the player who made the move.

	if (game.white.token == data.token && game.board.turn != Colour.White)
	{
		sendError(ws, 'Not your turn.')
		return
	}

	if (game.black.token == data.token && game.board.turn != Colour.Black)
	{
		sendError(ws, 'Not your turn.')
		return
	}

	// Make the move and broadcast it to all subscribers.

	const promotion = data.promotion

	try
	{
		game.sendMove(from, to, async () =>
		{
			// Ensure the player provided a valid promotion piece.

			if (promotion == null)
			{
				sendError(ws, 'Missing "promotion" field.')
				throw new Error('missing promotion')
			}

			return promotion
		})
	}
	catch
	{
		// This only happens if the move required a promotion, but
		// the client didn't provide one.
		// We don't need to do anything, since everything is already
		// handled in the `Game.sendMove()` function.
	}
}