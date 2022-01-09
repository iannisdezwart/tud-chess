import { Request, Response } from 'express'
import { games } from '../Game.js'

/**
 * Route that displays a specific game as a player.
 */
export const playRoute = (req: Request, res: Response) =>
{
	// Get the game ID from the URL.

	const gameID = req.params.gameID

	// Get the game object.

	const game = games.get(gameID)

	// If the game doesn't exist, redirect to the lobby.

	if (game == null)
	{
		res.redirect('/')
		return
	}

	// Render the game page.

	res.sendFile('play.html', { root: '../front-end' })
}