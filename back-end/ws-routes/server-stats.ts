import { WebSocket } from 'ws'
import { server, wsServer } from '../index.js'
import { games } from '../Game.js'
import { send } from '../util.js'

export const serverStats = (ws: WebSocket) =>
{
	send(ws, {
		type: 'server-stats',
		games: games.size,
		players: games.size * 2,
		webSocketConnections: wsServer.clients.size
	})
}