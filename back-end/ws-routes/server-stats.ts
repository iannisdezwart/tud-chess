import { WebSocket } from 'ws'
import { wsServer } from '../index.js'
import { games } from '../Game.js'
import { send } from '../util.js'
import { numberOfPastGames } from '../database.js'

export const serverStats = async (ws: WebSocket) =>
{
	send(ws, {
		type: 'server-stats',
		games: games.size,
		players: games.size * 2,
		webSocketConnections: wsServer.clients.size,
		pastGames: numberOfPastGames
	})
}