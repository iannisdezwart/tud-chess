import { WebSocket } from 'ws'
import { send } from './util.js'
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

	// List of WebSockets that are subscribed to this game.
	// All moves are broadcast to all subscribers.
	subscribers: Set<WebSocket>

	// The chess board.
	board: ChessBoard

	// The time of the last move.
	lastMoveTime: number

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

		this.subscribers = new Set()
		this.board = ChessBoard.generateDefault()
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

		send(ws, {
			type: 'game-state',
			board: this.board.toString(),
			turn: this.board.turn,
			player,
			usernames: {
				white: this.white.username,
				black: this.black.username
			},
			clocks
		})
	}

	/**
	 * Sends a move to all subscribers and updates the clock for
	 * the player who made the move.
	 */
	sendMove(from: Square, to: Square)
	{
		// Update remaining time on the clock.
		// The players are swapped because the move was alraedy made.

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
				}
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