import { WebSocket } from 'ws'
import { games } from '../Game.js'
import { sendError } from '../util.js'

interface MoveData
{
	type: 'move'
	gameID: string
	token: string
	from: Square
	to: Square
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

	game.board.move(from, to)
	game.sendMove(from, to)
}