import { Request, Response } from 'express'
import { readDatabase } from '../database.js'

/**
 * Route that analyses a past game.
 */
export const analyseRoute = async (req: Request, res: Response) =>
{
	// Get the game ID from the URL.

	const gameID = req.params.gameID

	// Get the game.

	const game = (await readDatabase(entry => entry.id == gameID))[0]

	// If the game doesn't exist, redirect to the past games page.

	if (game == null)
	{
		res.redirect('/past-games')
		return
	}

	// Redirect to the analysis page.

	res.sendFile('analyse.html', { root: '../front-end' })
}