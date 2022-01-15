// The game ID is the last part of the URL.

const gameID = location.href.split('/').pop()

let board
let IS_SPECTATOR = false

addEventListener('DOMContentLoaded', async () =>
{
	const boardContainerEl = document.querySelector('.chess-board-container')

	// Receive the game state.

	receive('game-state', data =>
	{
		board = new HTMLChessBoard(boardContainerEl, data.player)

		if (IS_SPECTATOR)
		{
			board.unselectable = true
		}

		board.setBoard(data.board)
		board.moves = data.moves

		board.whiteUsername = data.usernames.white
		board.blackUsername = data.usernames.black

		board.whiteClock = data.clocks.white
		board.blackClock = data.clocks.black
		board.latestMoveTime = Date.now()

		board.render()
		board.update()

		if (data.drawOffer != null)
		{
			board.handleDrawOffer(data.drawOffer)
		}
	})

	// Receive the game state updates.

	receive('move', data =>
	{
		if (board.board.turnNumber != data.turnNumber)
		{
			board.move(data.from, data.to,
				() => Promise.resolve(data.promotion))
		}

		board.whiteClock = data.clocks.white
		board.blackClock = data.clocks.black
		board.latestMoveTime = Date.now()

		board.update()
	})

	receive('end', data =>
	{
		board.endGame(data.winner, data.reason)
	})

	receive('draw-offer', data =>
	{
		board.handleDrawOffer(data.player)
	})
})