import { WebSocket } from 'ws'
import { Game, games, Player } from '../Game.js'
import { randomID, send, sendError } from '../util.js'

interface JoinGameData
{
	type: 'join-game',
	token: string
}

// Holds the current waiting player if there is one.
// This player will be added to a game when another player joins.
let waitingPlayer: Player

/**
 * Matches a player with a waiting player.
 * @param { JoinGameData } data The data sent by the client.
 * @param { WebSocket } ws The client's WebSocket.
 */
export const joinGame = (data: JoinGameData, ws: WebSocket) =>
{
	if (data.token == null)
	{
		sendError(ws, 'Missing "token" field.')
		return
	}

	if (waitingPlayer != null)
	{
		// There is a waiting player.
		// Create a new game and add the two players.

		const gameID = randomID(8)
		const waitingWs = waitingPlayer.ws

		const player1 = {
			ws: null, // Will be set when player 1 starts playing.
			token: data.token
		}

		const player2 = {
			ws: null, // Will be set when player 2 starts playing.
			token: waitingPlayer.token
		}

		const game = new Game(player1, player2)

		games.set(gameID, game)

		// Send the game ID to both players.

		send(waitingWs, {
			type: 'game-ready',
			gameID
		})

		send(ws, {
			type: 'game-ready',
			gameID
		})

		// Remove the waiting player.

		waitingPlayer = null
		return
	}

	// There is no waiting player.
	// Add the player to the waiting slot.

	waitingPlayer = { ws, token: data.token }
}