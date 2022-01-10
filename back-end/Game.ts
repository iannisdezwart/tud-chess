import { WebSocket } from 'ws'
import { send } from './util.js'
import { createHash } from 'crypto'
// @ts-ignore
import _ChessBoard from '../front-end/js/ChessBoard.js'
const ChessBoard = _ChessBoard as ChessBoardClass

export interface Player
{
	ws: WebSocket
	token: string
	username: string
	clock: number
}

/**
 * Class representing a chess game between two opponents.
 */
export class Game
{
	// The ID of the game.
	id: string

	// The two players.
	white: Player
	black: Player

	// Flags for offering draws.
	whiteOffersDraw: boolean
	blackOffersDraw: boolean

	// List of WebSockets that are subscribed to this game.
	// All moves are broadcast to all subscribers.
	subscribers: Set<WebSocket>

	// The chess board.
	board: ChessBoard

	// The time of the last move.
	lastMoveTime: number

	// A map of hashes of all board positions that have occurred.
	// The number of times this position has occurred is stored.
	// This is used to check threefold repetition.
	history: Map<string, number>

	// Counter for the 50 move rule.
	fiftyMoveRule: number

	constructor(id: string, player1: Player, player2: Player)
	{
		this.id = id

		if (Math.random() < 0.5)
		{
			this.white = player1
			this.black = player2
		}
		else
		{
			this.white = player2
			this.black = player1
		}

		this.whiteOffersDraw = false
		this.blackOffersDraw = false

		this.subscribers = new Set()
		this.board = ChessBoard.generateDefault()

		this.history = new Map()
		this.fiftyMoveRule = 0

		this.addHistory()
		this.handleTimeoutLoss()
	}

	/**
	 * Adds the current board position to the history.
	 */
	addHistory()
	{
		const board = this.board.boardStateString()
		const hash = createHash('sha256').update(board).digest('hex')

		if (this.history.has(hash))
		{
			const count = this.history.get(hash) + 1

			this.history.set(hash, count)

			return count
		}

		this.history.set(hash, 1)

		return 1
	}

	/**
	 * Handles ending the game if one player's clock runs out.
	 */
	handleTimeoutLoss()
	{
		const clocks = this.calculateClocks()

		// Check if one's clock has run out.

		if (clocks.white < 0)
		{
			this.endGame(Colour.Black, 'White ran out of time.')
			return
		}

		if (clocks.black < 0)
		{
			this.endGame(Colour.White, 'Black ran out of time.')
			return
		}

		// Get the lowest clock.

		const lowestClock = Math.min(clocks.white, clocks.black)

		// Set a timeout event to check again after the time on the
		// lowest clock. This is the earliest possible time to check
		// for a timeout loss.

		setTimeout(() => this.handleTimeoutLoss(), lowestClock)
	}

	/**
	 * Ends the game and broadcasts the winner to all subscribers.
	 * @param winner The colour of the winner. If null, the game is a draw.
	 */
	endGame(winner: Colour, reason: string)
	{
		// Broadcast the winner to all subscribers.

		for (const ws of this.subscribers)
		{
			send(ws, {
				type: 'end',
				winner,
				reason
			})
		}

		// Remove the game from the list of games.

		this.destroy()
	}

	/**
	 * Calculates the current clock for both players.
	 */
	calculateClocks()
	{
		const now = Date.now()
		const turn = this.board.turn

		let white = this.white.clock
		let black = this.black.clock

		// Only subtract time if it's the player's turn and
		// the second move has been made.
		// The opening moves don't count as time.

		if (turn == Colour.White && this.board.turnNumber >= 2)
		{
			white = this.white.clock - (now - this.lastMoveTime)
		}
		else if (turn == Colour.Black && this.board.turnNumber >= 2)
		{
			black = this.black.clock - (now - this.lastMoveTime)
		}

		return { white, black }
	}

	/**
	 * Sends the current game state to a given WebSocket.
	 */
	sendGameState(ws: WebSocket)
	{
		const player = ws == this.black.ws ? Colour.Black : Colour.White
		const clocks = this.calculateClocks()
		let drawOffer: Colour

		if (this.whiteOffersDraw)
		{
			drawOffer = Colour.White
		}
		else if (this.blackOffersDraw)
		{
			drawOffer = Colour.Black
		}

		send(ws, {
			type: 'game-state',
			board: this.board.toString(),
			turn: this.board.turn,
			player,
			usernames: {
				white: this.white.username,
				black: this.black.username
			},
			clocks,
			drawOffer
		})
	}

	/**
	 * Sends a move to all subscribers and updates the clock for
	 * the player who made the move.
	 */
	async sendMove(from: Square, to: Square, promotion: ChessPieceType)
	{
		// Reset draw offers.

		this.whiteOffersDraw = false
		this.blackOffersDraw = false

		// Perform the move.

		const numPiecesBefore = this.board.countPieces()
		const changedSquares = await this.board.move(from, to,
			() => Promise.resolve(promotion))
		const numPiecesAfter = this.board.countPieces()
		const pawnMove = changedSquares.find(sq =>
			this.board.pieceAt(sq.x, sq.y) != null
			&& this.board.pieceAt(sq.x, sq.y).type
				== ChessPieceType.Pawn) != null

		// Keep track of 50 move rule.

		if (numPiecesBefore == numPiecesAfter && !pawnMove)
		{
			this.fiftyMoveRule++

			if (this.fiftyMoveRule >= 100)
			{
				this.endGame(null, '50 move rule.')
				return
			}
		}

		// Update remaining time on the clock.
		// The players are swapped because the move was already made.

		const player = this.board.turn == Colour.Black
			? this.white : this.black

		if (this.lastMoveTime == null)
		{
			// The two opening moves don't count as time.

			if (this.board.turnNumber == 2)
			{
				this.lastMoveTime = Date.now()
			}
		}
		else
		{
			// Subtract the time since the last move.

			const now = Date.now()
			const elapsed = now - this.lastMoveTime

			player.clock = player.clock - elapsed
			this.lastMoveTime = now
		}

		// Broadcast the move to all subscribers.

		for (const ws of this.subscribers)
		{
			if (ws.readyState != WebSocket.OPEN)
			{
				continue
			}

			send(ws, {
				type: 'move',
				from, to,
				turnNumber: this.board.turnNumber,
				clocks: {
					white: this.white.clock,
					black: this.black.clock
				},
				promotion
			 })
		}

		// Check for threefold repetition.

		const count = this.addHistory()

		if (count == 3)
		{
			this.endGame(null, 'Draw by threefold repetition.')
			return
		}

		// Check if the game is over.

		if (!this.board.ended())
		{
			return
		}

		// Check if the game is won by black.

		if (this.board.turn == Colour.White && this.board.whiteInCheck())
		{
			this.endGame(Colour.Black, 'White is checkmated. Black wins.')
			return
		}

		// Check if the game is won by white.

		if (this.board.turn == Colour.Black && this.board.blackInCheck())
		{
			this.endGame(Colour.White, 'Black is checkmated. White wins.')
			return
		}

		// The game must be a draw.

		this.endGame(null, 'Draw by stalemate.')
	}

	/**
	 * Handles draw offers from the players.
	 */
	offerDraw(player: Colour)
	{
		if (player == Colour.White)
		{
			// Do nothing if white already offered a draw.

			if (this.whiteOffersDraw)
			{
				return
			}

			this.whiteOffersDraw = true
		}
		else
		{
			// Do nothing if black already offered a draw.

			if (this.blackOffersDraw)
			{
				return
			}

			this.blackOffersDraw = true
		}

		// If both players have offered a draw, the game is a draw.

		if (this.whiteOffersDraw && this.blackOffersDraw)
		{
			this.endGame(null, 'Draw by agreement.')
			return
		}

		// Broadcast the offer to all subscribers.

		for (const ws of this.subscribers)
		{
			send(ws, {
				type: 'draw-offer',
				player
			})
		}
	}

	/**
	 * Removes this game from the list of games.
	 */
	destroy()
	{
		games.delete(this.id)
	}
}

// Map of game IDs to games.
export const games: Map<string, Game> = new Map()