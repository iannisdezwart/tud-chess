import { games } from '../Game.js'

/**
 * Route that displays a specific game as a spectator.
 */
export const spectateRoute = (req, res) =>
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

	res.sendFile('spectate.html', { root: '../front-end' })
}