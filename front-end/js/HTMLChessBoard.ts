/**
 * Chess board wrapper. Holds the pieces, legal stuff,
 * and the HTML elements for the board.
 */
class HTMLChessBoard
{
	board: ChessBoard
	boardEl: HTMLElement
	boardContainerEl: HTMLElement

	player: Colour

	draggingPiece: boolean
	clickedPiece: HTMLElement
	clickedPieceSquare: Square

	unselectable = false

	whiteUsername: string
	blackUsername: string

	blackClock: number
	whiteClock: number
	latestMoveTime: number

	static CLOCK_UPDATE_HANDLER_INTERVAL = 100

	constructor(boardContainerEl: HTMLElement, player: Colour)
	{
		this.boardContainerEl = boardContainerEl
		this.board = ChessBoard.generateDefault()
		this.player = player
	}

	/**
	 * Sets the board from a string.
	 */
	setBoard(board: string)
	{
		this.board = ChessBoard.fromString(board)
	}

	/**
	 * Wraps a MouseEvent to a Touch, so we can write the same code for
	 * both mouse and touch events.
	 */
	wrapMouseEventToTouch(e: MouseEvent)
	{
		const { target, clientX, clientY } = e
		return new Touch({ identifier: 0, target, clientX, clientY })
	}

	/**
	 * Wraps a TouchEvent to a Touch, so we can write the same code for
	 * both mouse and touch events.
	 */
	wrapTouchEventToTouch(e: TouchEvent)
	{
		return e.changedTouches[0]
	}

	/**
	 * Returns the square the user is hovering over.
	 * The square is formatted absolutely, so it's always relative to the
	 * A1 square.
	 */
	pointedSquare(touch: Touch)
	{
		const { clientX, clientY } = touch
		const boardRect = this.boardEl.getBoundingClientRect()
		const xSel = Math.floor((clientX - boardRect.x) / boardRect.width * 8)
		const ySel = Math.floor((clientY - boardRect.y) / boardRect.height * 8)

		if (xSel < 0 || xSel >= 8 || ySel < 0 || ySel >= 8)
		{
			return null
		}

		const [ x, y ] = this.translatePointerPositionToSquare(xSel, ySel)
		return new Square(x, y)
	}

	/**
	 * Translates the pointer position to the relative position of a
	 * square HTML element on the board. Takes in account the board's
	 * rotation.
	 */
	translatePointerPositionToSquare(x: number, y: number)
	{
		if (this.player == Colour.White)
		{
			return [ x, 7 - y ]
		}
		else
		{
			return [ 7 - x, y ]
		}
	}

	/**
	 * Returns the HTML element that corresponds to a square on the
	 * chess board.
	 */
	getSquare(square: Square)
	{
		const { x, y } = square
		const sq = this.translatePointerPositionToSquare(x, y)
		return this.boardEl.children[sq[1]].children[sq[0]]
	}

	/**
	 * Handles the start of a drag.
	 */
	touchDownHandler(touch: Touch, e: Event)
	{
		// If we previously clicked on a piece and we now click on
		// a legal move square, we will perfome the move.

		const toSquare = this.pointedSquare(touch)
		let moved = false

		if (this.clickedPiece != null && toSquare != null
			&& this.getSquare(toSquare).classList.contains('legal-move'))
		{
			this.performMove(this.clickedPieceSquare, toSquare)
			moved = true
		}

		// Remove the old legal move highlights.

		this.clearLegalMoves()

		// If we already moved the piece,
		// we don't have to do anything else.

		if (moved)
		{
			return
		}

		// Check if the user is hovering over a piece.

		const target = touch.target as HTMLElement

		if (!target.classList.contains('piece')
			|| !target.classList.contains('selectable'))
		{
			return
		}

		// Prevent mobile scrolling.

		e.preventDefault()

		// Get the dragged piece and its square.

		this.clickedPiece = target
		this.clickedPieceSquare = this.pointedSquare(touch)
		this.draggingPiece = true

		// Show the legal moves.

		const { x: xFrom, y: yFrom } = this.clickedPieceSquare
		const legalMoves = this.board.possibleMoves(xFrom, yFrom, true)

		for (const square of legalMoves)
		{
			const squareEl = this.getSquare(square)
			squareEl.classList.add('legal-move')
		}
	}

	/**
	 * Handles dragging.
	 */
	touchMoveHandler(touch: Touch, e: Event)
	{
		if (!this.draggingPiece)
		{
			return
		}

		// Prevent mobile scrolling.

		e.preventDefault()

		// Update the position of the dragged piece.

		const { clientX, clientY } = touch
		const img = this.clickedPiece.querySelector<HTMLImageElement>('img')
		const rect = this.clickedPiece.getBoundingClientRect()

		const middleX = rect.x + rect.width / 2
		const middleY = rect.y + rect.height / 2

		const x = (clientX - middleX) / rect.width * 100
		const y = (clientY - middleY) / rect.height * 100

		img.style.transform = `translate(${ x }%, ${ y }%)`
		img.style.zIndex = '1'
	}

	/**
	 * Handles the end of a drag.
	 */
	touchUpHandler(touch: Touch, e: Event)
	{
		if (!this.draggingPiece)
		{
			return
		}

		// Prevent mobile scrolling.

		e.preventDefault()

		// Get the square where the piece came from and where
		// it was dropped.

		const fromSquare = this.clickedPieceSquare
		const toSquare = this.pointedSquare(touch)

		let moveIsLegal = false

		if (toSquare != null)
		{
			const toSquareEl = this.getSquare(toSquare)
			moveIsLegal = toSquareEl.classList.contains('legal-move')
		}

		// Undo the visual translations on the piece.

		const img = this.clickedPiece.querySelector<HTMLImageElement>('img')

		img.style.transform = null
		img.style.zIndex = null
		this.draggingPiece = false

		// If the move is not legal, return the piece to its original
		// position.

		if (fromSquare.equals(toSquare) || !moveIsLegal)
		{
			return
		}

		// The move is legal, so we can perform it.

		this.performMove(fromSquare, toSquare)
	}

	/**
	 * Clears the legal move highlights.
	 */
	clearLegalMoves()
	{
		for (const square of [].slice.call(document.querySelectorAll('.legal-move')))
		{
			square.classList.remove('legal-move')
		}
	}

	/**
	 * Performs a move.
	 */
	async performMove(fromSquare: Square, toSquare: Square)
	{
		// Perform the move locally.

		let promotion: ChessPieceType

		await this.move(fromSquare, toSquare, async () => {
			promotion = await this.promptPromotion()
			return promotion
		})

		// Clear the legal move highlights.

		this.clearLegalMoves()

		// Send the move to the server.

		send({
			type: 'move',
			gameID,
			token: await userToken(),
			from: fromSquare,
			to: toSquare,
			promotion
		})
	}

	/**
	 * Returns the piece at a square.
	 * Does not take into account the board's rotation.
	 */
	pieceAt(x: number, y: number)
	{
		if (this.player == Colour.White)
		{
			return this.board.pieceAt(x, y)
		}

		return this.board.pieceAt(7 - x, 7 - y)
	}

	/**
	 * Prompts the user to choose a piece to promote to.
	 */
	promptPromotion(): Promise<ChessPieceType>
	{
		const player = this.player

		document.body.insertAdjacentHTML('beforeend', /* html */ `
		<div class="promotion">
			<div class="promotion-title">Promote to:</div>

			<div class="promotion-pieces">
				<div class="queen">
					${ new ChessPiece(ChessPieceType.Queen, player).svg() }
				</div>

				<div class="rook">
					${ new ChessPiece(ChessPieceType.Rook, player).svg() }
				</div>

				<div class="bishop">
					${ new ChessPiece(ChessPieceType.Bishop, player).svg() }
				</div>

				<div class="knight">
					${ new ChessPiece(ChessPieceType.Knight, player).svg() }
				</div>
			</div>
		</div>
		`)

		const queen = document.querySelector('.promotion-pieces .queen')
		const rook = document.querySelector('.promotion-pieces .rook')
		const bishop = document.querySelector('.promotion-pieces .bishop')
		const knight = document.querySelector('.promotion-pieces .knight')

		return new Promise(resolve =>
		{
			const choose = (choice: ChessPieceType) =>
			{
				document.querySelector('.promotion').remove()
				resolve(choice)
			}

			queen.addEventListener('click', () => choose(ChessPieceType.Queen))
			rook.addEventListener('click', () => choose(ChessPieceType.Rook))
			bishop.addEventListener('click', () => choose(ChessPieceType.Bishop))
			knight.addEventListener('click', () => choose(ChessPieceType.Knight))
		})
	}

	/**
	 * Performs a move on the board.
	 */
	async move(from: Square, to: Square, promotion: () => Promise<ChessPieceType>)
	{
		// Resets any draw offers.

		const gameInfoEl = document.querySelector('.game-info') as HTMLElement
		gameInfoEl.innerText = ''

		if (!IS_SPECTATOR)
		{
			const drawButton = document.querySelector('#offer-draw') as HTMLElement
			drawButton.classList.remove('glow')
		}

		// Perform the move.

		const changedSquares = await this.board.move(from, to, promotion)

		// Update the board.

		for (const changedSquare of changedSquares)
		{
			let { x, y } = changedSquare

			// Update the square if the board is rotated.

			if (this.player == Colour.Black)
			{
				x = 7 - x
				y = 7 - y
			}

			const piece = this.pieceAt(x, y)
			const squareEl = this.getSquare(changedSquare)
			const pieceEl = squareEl.querySelector('.piece')

			// Empty the square.

			if (pieceEl != null)
			{
				pieceEl.remove()
			}

			if (piece == null)
			{
				continue
			}

			// Update the piece on the square.

			squareEl.insertAdjacentHTML('beforeend', /* html */ `
			<div class="piece">
				${ this.pieceAt(x, y).svg() }
			</div>
			`)
		}

		// Update the selectable pieces.

		this.updateSelectablePieces()
	}

	/**
	 * Updates the selectable pieces on the board.
	 * Called after a move is made, and after the game has ended.
	 */
	updateSelectablePieces()
	{
		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.board.pieceAt(x, y)
				const square = new Square(x, y)
				const squareEl = this.getSquare(square)
				const pieceEl = squareEl.querySelector('.piece')

				if (pieceEl == null)
				{
					continue
				}

				if (!this.unselectable
					&& this.board.turn == this.player
					&& piece.colour == this.board.turn)
				{
					pieceEl.classList.add('selectable')
				}
				else
				{
					pieceEl.classList.remove('selectable')
				}
			}
		}
	}

	/**
	 * Renders the board.
	 */
	render()
	{
		const boardBorderEl = document.createElement('div')
		boardBorderEl.classList.add('board-border')

		this.boardEl = document.createElement('div')
		this.boardEl.classList.add('board')

		for (let y = 7; y >= 0; y--)
		{
			const row = document.createElement('div')
			row.classList.add('board-row')

			for (let x = 0; x < 8; x++)
			{
				const cell = document.createElement('div')
				cell.classList.add('board-cell')

				const flipped = y % 2 == 0 ? 'flipped' : ''

				if (this.board.squareColour(x, y) == Colour.Black)
				{
					cell.innerHTML += /* html */ `
					<div class="square ${ flipped }">
						<img src='/res/svg/board/dark-square.svg'>
					</div>
					`
				}
				else
				{
					cell.innerHTML += /* html */ `
					<div class="square ${ flipped }">
						<img src='/res/svg/board/light-square.svg'>
					</div>
					`
				}

				const piece = this.pieceAt(x, y)

				if (piece != null)
				{
					if (!this.unselectable
						&& this.board.turn == this.player
						&& piece.colour == this.board.turn)
					{
						cell.innerHTML += /* html */ `
						<div class="selectable piece">
							${ this.pieceAt(x, y).svg() }
						</div>
						`
					}
					else
					{
						cell.innerHTML += /* html */ `
						<div class="piece">
							${ this.pieceAt(x, y).svg() }
						</div>
						`
					}

				}

				row.appendChild(cell)
			}

			this.boardEl.appendChild(row)
		}

		boardBorderEl.appendChild(this.boardEl)

		this.boardContainerEl.innerHTML = ''
		this.boardContainerEl.appendChild(boardBorderEl)

		this.boardEl.addEventListener('mousedown', e =>
		{
			this.touchDownHandler(this.wrapMouseEventToTouch(e), e)
		})

		this.boardEl.addEventListener('touchstart', e =>
		{
			this.touchDownHandler(this.wrapTouchEventToTouch(e), e)
		})

		this.boardEl.addEventListener('mousemove', e =>
		{
			this.touchMoveHandler(this.wrapMouseEventToTouch(e), e)
		})

		this.boardEl.addEventListener('touchmove', e =>
		{
			this.touchMoveHandler(this.wrapTouchEventToTouch(e), e)
		})

		this.boardEl.addEventListener('mouseup', e =>
		{
			this.touchUpHandler(this.wrapMouseEventToTouch(e), e)
		})

		this.boardEl.addEventListener('touchend', e =>
		{
			this.touchUpHandler(this.wrapTouchEventToTouch(e), e)
		})

		this.boardContainerEl.insertAdjacentHTML('beforeend', /* html */ `
		<div class="stats">
			<div class="top">
				<div class="eaten-pieces"></div>
				<div class="username"></div>
				<div class="clock"></div>
			</div>

			<div class="bottom">
				<div class="clock"></div>
				<div class="username"></div>
				<div class="eaten-pieces"></div>
			</div>

			${ !IS_SPECTATOR ? /* html */ `
			<div class="buttons">
				<button id="resign">Resign</button>
				<button id="offer-draw">Offer draw</button>
			</div>
			` : '' }

			<div class="game-info"></div>
		</div>
		`)

		// Display the usernames of the players.

		const statsEl = this.boardContainerEl.querySelector('.stats')

		const topUsernameEl = statsEl.querySelector('.top .username') as HTMLElement
		const bottomUsernameEl = statsEl.querySelector('.bottom .username') as HTMLElement

		if (this.player == Colour.White)
		{
			topUsernameEl.innerText = this.blackUsername
			bottomUsernameEl.innerText = this.whiteUsername
		}
		else
		{
			topUsernameEl.innerText = this.whiteUsername
			bottomUsernameEl.innerText = this.blackUsername
		}

		// Activate the draw offer and resign buttons.

		if (!IS_SPECTATOR)
		{
			const buttonsEl = statsEl.querySelector('.buttons') as HTMLElement

			const resignEl = buttonsEl.querySelector('#resign') as HTMLElement
			const offerDrawEl = buttonsEl.querySelector('#offer-draw') as HTMLElement

			resignEl.addEventListener('click', async () =>
			{
				send({
					type: 'resign',
					gameID,
					token: await userToken()
				})
			})

			offerDrawEl.addEventListener('click', async () =>
			{
				send({
					type: 'offer-draw',
					gameID,
					token: await userToken()
				})
			})
		}
	}

	/**
	 * Returns a given millisecond clock in a human readable format.
	 */
	getClock(clock: number, isTurn: boolean)
	{
		// If needed, subtract the elapsed time since the last move.

		let elapsedTime = Date.now() - this.latestMoveTime

		if (!isTurn || this.board.turnNumber < 2)
		{
			elapsedTime = 0
		}

		const time = clock - elapsedTime

		// Ensure the clock stays positive.

		if (time < 0)
		{
			return `0:00.0`
		}

		// Calculate the minutes and seconds.

		const seconds = Math.floor(time / 1000)
		const minutes = Math.floor(seconds / 60)
		const secondsLeft = seconds % 60

		// Return a normal human readable string.

		if (seconds > 10)
		{
			const mm = minutes.toFixed(0)
			const ss = secondsLeft.toFixed(0).padStart(2, '0')

			return `${ mm }:${ ss }`
		}

		// Return a human readable string with a tenth of a second.

		const ss = secondsLeft.toFixed(0).padStart(2, '0')
		const hundreds = Math.floor(time / 100) % 10

		return `0:${ ss }.${ hundreds }`
	}

	/**
	 * Returns the white player's clock in a human readable format.
	 */
	getWhiteClock()
	{
		return this.getClock(this.whiteClock, this.board.turn == Colour.White)
	}

	/**
	 * Returns the black player's clock in a human readable format.
	 */
	getBlackClock()
	{
		return this.getClock(this.blackClock, this.board.turn == Colour.Black)
	}

	/**
	 * Function that is called repetitively, updating the clocks
	 * of both players every 100ms.
	 * This function is stopped and restarted after every move.
	 */
	clockUpdateHandler(currentTurnNumber: number)
	{
		if (this.board.turnNumber != currentTurnNumber)
		{
			return
		}

		let whiteClockEl: HTMLElement
		let blackClockEl: HTMLElement

		// Get the elements of the clocks.

		if (this.player == Colour.White)
		{
			whiteClockEl = this.boardContainerEl.querySelector('.stats .bottom .clock')
			blackClockEl = this.boardContainerEl.querySelector('.stats .top .clock')
		}
		else
		{
			whiteClockEl = this.boardContainerEl.querySelector('.stats .top .clock')
			blackClockEl = this.boardContainerEl.querySelector('.stats .bottom .clock')
		}

		// Update the clock elements to the current time on the clocks.

		whiteClockEl.innerText = this.getWhiteClock()
		blackClockEl.innerText = this.getBlackClock()

		// Don't update the clocks before move 3.
		// The opening moves are not timed.

		if (this.board.turnNumber < 2)
		{
			return
		}

		// Schedule the next clock update.

		setTimeout(() =>
		{
			this.clockUpdateHandler(currentTurnNumber)
		}, HTMLChessBoard.CLOCK_UPDATE_HANDLER_INTERVAL)
	}

	/**
	 * Starts updating the clocks of both players.
	 */
	updateClocks()
	{
		// Start updating the clocks.

		this.clockUpdateHandler(this.board.turnNumber)
	}

	/**
	 * Updates the score indicators of both players.
	 */
	updateScore()
	{
		const score = this.board.computeScore()

		// Create an HTML string for both players' score indicators.

		const whiteScoreIndicator = /* html */ `
		${ new ChessPiece(ChessPieceType.Pawn, Colour.Black).svg().repeat(score.blackPawnsEaten) }
		${ new ChessPiece(ChessPieceType.Knight, Colour.Black).svg().repeat(score.blackKnightsEaten) }
		${ new ChessPiece(ChessPieceType.Bishop, Colour.Black).svg().repeat(score.blackBishopsEaten) }
		${ new ChessPiece(ChessPieceType.Rook, Colour.Black).svg().repeat(score.blackRooksEaten) }
		${ new ChessPiece(ChessPieceType.Queen, Colour.Black).svg().repeat(score.blackQueensEaten) }
		`

		const blackScoreIndicator = /* html */ `
		${ new ChessPiece(ChessPieceType.Pawn, Colour.White).svg().repeat(score.whitePawnsEaten) }
		${ new ChessPiece(ChessPieceType.Knight, Colour.White).svg().repeat(score.whiteKnightsEaten) }
		${ new ChessPiece(ChessPieceType.Bishop, Colour.White).svg().repeat(score.whiteBishopsEaten) }
		${ new ChessPiece(ChessPieceType.Rook, Colour.White).svg().repeat(score.whiteRooksEaten) }
		${ new ChessPiece(ChessPieceType.Queen, Colour.White).svg().repeat(score.whiteQueensEaten) }
		`

		const statsEl = this.boardContainerEl.querySelector('.stats')

		const topScoreEl = statsEl.querySelector('.top .eaten-pieces')
		const bottomScoreEl = statsEl.querySelector('.bottom .eaten-pieces')

		if (this.player == Colour.White)
		{
			topScoreEl.innerHTML = blackScoreIndicator
			bottomScoreEl.innerHTML = whiteScoreIndicator
		}
		else
		{
			topScoreEl.innerHTML = whiteScoreIndicator
			bottomScoreEl.innerHTML = blackScoreIndicator
		}
	}

	/**
	 * Handles all the updates that need to be done after a move.
	 */
	update()
	{
		this.updateClocks()
		this.updateScore()
	}

	/**
	 * Handles a draw offer.
	 */
	handleDrawOffer(player: Colour)
	{
		const playerColour = player == Colour.White ? 'White' : 'Black'
		const gameInfoEl = document.querySelector('.game-info') as HTMLElement
		gameInfoEl.innerText = `${ playerColour } has offered a draw.`

		if (!IS_SPECTATOR)
		{
			const drawButton = document.querySelector('#offer-draw') as HTMLElement
			drawButton.classList.add('glow')
		}
	}

	/**
	 * Handles the end of a game.
	 */
	endGame(winner: Colour, reason: string)
	{
		// Stop the clock update handler.

		this.board.turnNumber++

		// Make the board unselecatble.

		this.unselectable = true
		this.updateSelectablePieces()

		// Show the reason for the end of the game.

		const gameInfoEl = this.boardContainerEl.querySelector('.game-info') as HTMLElement
		gameInfoEl.innerText = reason

		// Flip the opponent's king upside down.

		if (winner == null)
		{
			return
		}

		const opponent = winner == Colour.White
			? Colour.Black : Colour.White

		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.board.pieceAt(x, y)

				if (piece != null
					&& piece.type == ChessPieceType.King
					&& piece.colour == opponent)
				{
					const opponentKing = this.getSquare(new Square(x, y))
					opponentKing.querySelector('.piece').classList.add('flipped')
				}
			}
		}
	}
}