interface GameStateData
{
	type: 'game-state'
	board: string
	turn: Colour
	player: Colour
}

interface MoveData
{
	type: 'move'
	from: Square
	to: Square
}

// The game ID is the last part of the URL.

const gameID = location.href.split('/').pop()

let board: HTMLChessBoard

addEventListener('DOMContentLoaded', async () =>
{
	const boardContainerEl = document.querySelector('.chess-board-container') as HTMLElement

	// Subscribe to the game.

	send({ type: 'play-game', gameID, token: await userToken() })

	// Receive the game state.

	receive('game-state', (data: GameStateData) =>
	{
		board = new HTMLChessBoard(boardContainerEl, data.player)
		board.setBoard(data.board)
		board.render()
	})

	// Receive the game state updates.

	receive('move', (data: MoveData) =>
	{
		board.board.move(data.from, data.to)
		board.render()
	})
})

// Update the pointer position.
// This is used to determine what square the user is hovering over.

const curPointerPos = [ innerWidth / 2, innerHeight / 2 ]

addEventListener('mousemove', e =>
{
	curPointerPos[0] = e.clientX
	curPointerPos[1] = e.clientY
})