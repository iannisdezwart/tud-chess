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
	 * Sends the current game state to a given WebSocket.
	 */
	sendGameState(ws: WebSocket)
	{
		const player = ws == this.black.ws ? Colour.Black : Colour.White

		send(ws, {
			type: 'game-state',
			board: this.board.toString(),
			turn: this.board.turn,
			player,
			whiteUsername: this.white.username,
			blackUsername: this.black.username
		})
	}

	/**
	 * Sends a move to all subscribers.
	 */
	sendMove(from: Square, to: Square)
	{
		for (const ws of this.subscribers)
		{
			if (ws.readyState != WebSocket.OPEN)
			{
				continue
			}

			send(ws, {
				type: 'move',
				from, to,
				turnNumber: this.board.turnNumber
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