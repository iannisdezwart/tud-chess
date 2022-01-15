interface GameData
{
	type: 'game'
	game: {
		id: string
		whiteUsername: string
		blackUsername: string
		moves: Move[]
		dateTime: number
		winner: Colour
	}
}

IS_SPECTATOR = true

addEventListener('DOMContentLoaded', async () =>
{
	const gameID = location.href.split('/').pop()
	const boardContainerEl = document.querySelector('.chess-board-container') as HTMLElement

	// Analyse the game.

	send({ type: 'analyse-game', gameID })

	// Receive the game.

	receive('game', (data: GameData) =>
	{
		board = new HTMLChessBoard(boardContainerEl, Colour.White)

		board.unselectable = true

		board.moves = []

		board.whiteUsername = data.game.whiteUsername
		board.blackUsername = data.game.blackUsername
		board.analysisMode = true

		board.render()
		board.update()

		// Keep a history of board states.

		const history: { board: SerialisedChessBoard, moves: string }[] = []

		// Handle arrow keys.

		const handleLeftArrow = () =>
		{
			// Don't allow going before the first move.

			if (history.length == 0)
			{
				return
			}

			// Go back in history.

			const oldBoardState = history.pop()

			// Update the board.

			board.board = ChessBoard.deserialise(oldBoardState.board)

			board.render()
			board.update()

			// Reregister the arrow button event listeners.

			const leftArrowKey = document.querySelector('.left.arrow')
			const rightArrowKey = document.querySelector('.right.arrow')

			leftArrowKey.addEventListener('click', handleLeftArrow)
			rightArrowKey.addEventListener('click', handleRightArrow)

			// Update the move list.

			const pastMovesEl = document.querySelector('.past-moves') as HTMLElement

			pastMovesEl.innerHTML = oldBoardState.moves
			pastMovesEl.style.scrollBehavior = 'unset'
			pastMovesEl.scrollLeft = pastMovesEl.scrollWidth
			pastMovesEl.style.scrollBehavior = 'smooth'
		}

		const handleRightArrow = () =>
		{
			if (history.length == data.game.moves.length)
			{
				return
			}

			const serialisedBoard = board.board.serialise()
			const oldMoves = document.querySelector('.past-moves').innerHTML

			// Get the move at the current position.

			const move = data.game.moves[history.length]

			// Make the move.

			board.move(move.from, move.to,
				() => Promise.resolve(move.promotion))

			// Add the board state to the history.

			history.push({
				board: serialisedBoard,
				moves: oldMoves
			})


			// Update the board.

			board.update()
		}

		// Register the arrow keys.

		document.addEventListener('keydown', e =>
		{
			switch (e.code)
			{
				case 'ArrowLeft':
				{
					handleLeftArrow()
					break
				}

				case 'ArrowRight':
				{
					handleRightArrow()
					break
				}
			}
		})

		const leftArrowKey = document.querySelector('.left.arrow')
		const rightArrowKey = document.querySelector('.right.arrow')

		leftArrowKey.addEventListener('click', handleLeftArrow)
		rightArrowKey.addEventListener('click', handleRightArrow)
	})
})