interface GameReadyData
{
	type: 'game-ready'
	gameID: string
}

// If a game is ready, join it.

receive('game-ready', (data: GameReadyData) =>
{
	location.href = `/play/${ data.gameID }`
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

// Handle the username input.

addEventListener('DOMContentLoaded', () =>
{
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
})