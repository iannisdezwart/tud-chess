import { WebSocket } from 'ws'
import { send } from './util.js'
// @ts-ignore
import _ChessBoard from '../front-end/js/ChessBoard.js'
const ChessBoard = _ChessBoard as ChessBoardClass

export interface Player
{
	ws: WebSocket
	token: string
}

/**
 * Class representing a chess game between two opponents.
 */
export class Game
{
	white: Player
	black: Player

	board: ChessBoard

	constructor(player1: Player, player2: Player)
	{
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

		this.board = ChessBoard.generateDefault()
	}

	sendGameState(ws: WebSocket)
	{
		const player = this.white.ws ? Colour.White : Colour.Black

		send(ws, {
			type: 'game-state',
			board: this.board.toString(),
			turn: this.board.turn,
			player
		})
	}
}

// Map of game IDs to games.
export const games: Map<string, Game> = new Map()