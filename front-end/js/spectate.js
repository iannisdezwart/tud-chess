IS_SPECTATOR = true

addEventListener('DOMContentLoaded', async () =>
{
	// Spectate the game.

	wsModule.send({ type: 'spectate-game', gameID })
})