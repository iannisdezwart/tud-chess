interface Move
{
	from: Square
	to: Square
	promotion: ChessPieceType
	movedPiece: ChessPiece
}

interface GameStateData
{
	type: 'game-state'
	board: SerialisedChessBoard
	moves: Move[]
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
	promotion: ChessPieceType
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

	receive('move', (data: MoveData) =>
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

	receive('end', (data: EndData) =>
	{
		board.endGame(data.winner, data.reason)
	})

	receive('draw-offer', (data: DrawOfferData) =>
	{
		board.handleDrawOffer(data.player)
	})
})