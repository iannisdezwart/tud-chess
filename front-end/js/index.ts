interface GameReadyData
{
	type: 'game-ready'
	gameID: string
}

// If a game is ready, join it.

receive('game-ready', (data: GameReadyData) =>
{
	location.href = `/game/${ data.gameID }`
})

/**
 * Ask the server to join a game.
 */
const joinGame = async () =>
{
	send({ type: 'join-game', token: await userToken() })
}