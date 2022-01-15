import { randomID, send } from '../util.js'

/**
 * Sends a new user token to a client.
 * This token can be used to identify the user.
 * The client must send this token back to the server when it wants
 * to join or play a game.
 * @param ws The client's WebSocket.
 */
export const getUserToken = ws =>
{
	const id = randomID(64)

	send(ws, {
		type: 'user-token',
		token: id
	})
}