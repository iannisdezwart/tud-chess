addEventListener('DOMContentLoaded', async () =>
{
	// Join the game as a player.

	wsModule.send({ type: 'play-game', gameID, token: await userToken() })
})