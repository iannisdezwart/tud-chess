interface GameStateData
{
	type: 'game-state'
	board: string
	turn: Colour
	player: Colour
	usernames: {
		white: string
		black: string
	}
	clocks: {
		white: number
		black: number
	}
	drawOffer: Colour
}

interface MoveData
{
	type: 'move'
	from: Square
	to: Square
	turnNumber: number
	clocks: {
		white: number
		black: number
	}
}

interface EndData
{
	type: 'end'
	winner: Colour
	reason: string
}

interface DrawOfferData
{
	type: 'draw-offer'
	player: Colour
}

// The game ID is the last part of the URL.

const gameID = location.href.split('/').pop()

let board: HTMLChessBoard
let IS_SPECTATOR = false

addEventListener('DOMContentLoaded', async () =>
{
	const boardContainerEl = document.querySelector('.chess-board-container') as HTMLElement

	// Receive the game state.

	receive('game-state', (data: GameStateData) =>
	{
		board = new HTMLChessBoard(boardContainerEl, data.player)

		if (IS_SPECTATOR)
		{
			board.unselectable = true
		}

		board.setBoard(data.board)

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

	receive('move', (data: MoveData) =>
	{
		if (board.board.turnNumber != data.turnNumber)
		{
			board.move(data.from, data.to)
		}

		board.whiteClock = data.clocks.white
		board.blackClock = data.clocks.black
		board.latestMoveTime = Date.now()

		board.update()
	})

	receive('end', (data: EndData) =>
	{
		board.endGame(data.winner, data.reason)
	})

	receive('draw-offer', (data: DrawOfferData) =>
	{
		board.handleDrawOffer(data.player)
	})
})