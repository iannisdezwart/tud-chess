import { Request, Response } from 'express'
import { wsServer } from '../index.js'
import { getNumberOfPastGames } from '../database.js'
import { games } from '../Game.js'

/**
 * Route that displays the past games.
 */
export const homeScreenRoute = (_req: Request, res: Response) =>
{
	res.render('../views/index.ejs', {
		playerCount: games.size * 2,
		gameCount: games.size,
		webSocketConnectionCount: wsServer.clients.size,
		pastGameCount: getNumberOfPastGames()
	})
}