import { WebSocket } from 'ws'
import { wsServer } from '../index.js'
import { games } from '../Game.js'
import { send } from '../util.js'
import { getNumberOfPastGames } from '../database.js'

/**
 * Sends some server statistics to the client.
 * The client will display them on the home page.
 */
export const serverStats = async (ws: WebSocket) =>
{
	send(ws, {
		type: 'server-stats',
		games: games.size,
		players: games.size * 2,
		webSocketConnections: wsServer.clients.size,
		pastGames: getNumberOfPastGames()
	})
}