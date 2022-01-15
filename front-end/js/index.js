// If a game is ready, join it.

wsModule.receive('game-ready', data =>
{
	location.href = `/play/${ data.gameID }`
})

// When we get server stats, dipslay them.

wsModule.receive('server-stats', data =>
{
	const playerCount = document.querySelector('#stats #player-count')
	const gameCount = document.querySelector('#stats #game-count')
	const webSocketCount = document.querySelector('#stats #websocket-connection-count')
	const pastGamesCount = document.querySelector('#stats #past-games-count')

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
	wsModule.send({
		type: 'join-game',
		token: await userToken(),
		username: localStorage.getItem('username')
	})

	document.querySelector('.waiting').classList.add('visible')
}

addEventListener('DOMContentLoaded', () =>
{
	// Handle the username input.

	const usernameInput = document.querySelector('#username')
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

	wsModule.send({ type: 'get-server-stats' })

	setInterval(() => send({ type: 'get-server-stats' }), 500)
})