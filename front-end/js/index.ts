interface GameReadyData
{
	type: 'game-ready'
	gameID: string
}

interface ServerStatsData
{
	type: 'server-stats'
	games: number
	players: number
	webSocketConnections: number
	pastGames: number
}

// If a game is ready, join it.

receive('game-ready', (data: GameReadyData) =>
{
	location.href = `/play/${ data.gameID }`
})

// When we get server stats, dipslay them.

receive('server-stats', (data: ServerStatsData) =>
{
	const playerCount = document.querySelector('#stats #player-count') as HTMLElement
	const gameCount = document.querySelector('#stats #game-count') as HTMLElement
	const webSocketCount = document.querySelector('#stats #websocket-connection-count') as HTMLElement
	const pastGamesCount = document.querySelector('#stats #past-games-count') as HTMLElement

	playerCount.innerText = data.players.toString()
	gameCount.innerText = data.games.toString()
	webSocketCount.innerText = data.webSocketConnections.toString()
	pastGamesCount.innerText = data.pastGames.toString()
})

/**
 * Ask the server to join a game.
 */
const joinGame = async () =>
{
	send({
		type: 'join-game',
		token: await userToken(),
		username: localStorage.getItem('username')
	})

	document.querySelector('.waiting').classList.add('visible')
}

addEventListener('DOMContentLoaded', () =>
{
	// Handle the username input.

	const usernameInput = document.querySelector('#username') as HTMLInputElement
	const username = localStorage.getItem('username')

	if (username == null)
	{
		localStorage.setItem('username', 'Anonymous')
	}

	usernameInput.value = localStorage.getItem('username')

	usernameInput.addEventListener('change', () =>
	{
		localStorage.setItem('username', usernameInput.value)
	})

	// Fetch server stats.

	send({ type: 'get-server-stats' })

	setInterval(() => send({ type: 'get-server-stats' }), 500)
})