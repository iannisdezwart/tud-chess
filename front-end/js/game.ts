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
	turnNumber: number
}

// The game ID is the last part of the URL.

const gameID = location.href.split('/').pop()

let board: HTMLChessBoard
let BOARD_UNSELECTABLE = false

addEventListener('DOMContentLoaded', async () =>
{
	const boardContainerEl = document.querySelector('.chess-board-container') as HTMLElement

	// Receive the game state.

	receive('game-state', (data: GameStateData) =>
	{
		board = new HTMLChessBoard(boardContainerEl, data.player)

		if (BOARD_UNSELECTABLE)
		{
			board.unselectable = true
		}

		board.setBoard(data.board)
		board.render()
	})

	// Receive the game state updates.

	receive('move', (data: MoveData) =>
	{
		if (board.board.turnNumber != data.turnNumber)
		{
			board.move(data.from, data.to)
		}
	})
})