BOARD_UNSELECTABLE = true

addEventListener('DOMContentLoaded', async () =>
{
	// Spectate the game.

	send({ type: 'spectate-game', gameID })
})