addEventListener('DOMContentLoaded', async () =>
{
	// Join the game as a player.

	send({ type: 'play-game', gameID, token: await userToken() })
})