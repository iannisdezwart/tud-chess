import { WebSocket } from 'ws'
// @ts-ignore
import _ChessBoard from '../front-end/js/ChessBoard.js'
const ChessBoard = _ChessBoard as ChessBoardClass

/**
 * Class representing a chess game between two opponents.
 */
export class Game
{
	white: WebSocket
	black: WebSocket

	board: ChessBoard

	constructor(white: WebSocket, black: WebSocket)
	{
		this.white = white
		this.black = black

		this.board = ChessBoard.generateDefault()
	}
}