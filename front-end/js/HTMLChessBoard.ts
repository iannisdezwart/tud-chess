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

	draggingPiece: HTMLElement
	draggingPieceSquare: Square

	unselectable = false

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

		this.draggingPiece = target
		this.draggingPieceSquare = this.pointedSquare(touch)

		// Show the legal moves.

		const { x: xFrom, y: yFrom } = this.draggingPieceSquare
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
		if (this.draggingPiece == null)
		{
			return
		}

		// Prevent mobile scrolling.

		e.preventDefault()

		// Update the position of the dragged piece.

		const { clientX, clientY } = touch
		const img = this.draggingPiece.querySelector<HTMLImageElement>('img')
		const rect = this.draggingPiece.getBoundingClientRect()

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
	async touchUpHandler(touch: Touch, e: Event)
	{
		if (this.draggingPiece == null)
		{
			return
		}

		// Prevent mobile scrolling.

		e.preventDefault()

		// Get the square where the piece came from and where
		// it was dropped.

		const fromSquare = this.draggingPieceSquare
		const toSquare = this.pointedSquare(touch)

		let moveIsLegal = false

		if (toSquare != null)
		{
			const toSquareEl = this.getSquare(toSquare)
			moveIsLegal = toSquareEl.classList.contains('legal-move')
		}

		// Undo the visual translations on the piece.

		const img = this.draggingPiece.querySelector<HTMLImageElement>('img')

		img.style.transform = null
		img.style.zIndex = null
		this.draggingPiece = null

		// Remove the legal move highlights.

		for (const square of [].slice.call(document.querySelectorAll('.legal-move')))
		{
			square.classList.remove('legal-move')
		}

		// If the move is not legal, return the piece to its original
		// position.

		if (fromSquare.equals(toSquare) || !moveIsLegal)
		{
			return
		}

		// Send the move to the server.

		send({
			type: 'move',
			gameID,
			token: await userToken(),
			from: fromSquare,
			to: toSquare,
		})

		// Perform the move locally.

		this.move(fromSquare, toSquare)
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
	 * Performs a move on the board.
	 */
	move(from: Square, to: Square)
	{
		// Perform the move.

		const changedSquares = this.board.move(from, to)

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

				if (this.board.squareColour(x, y) == Colour.Black)
				{
					cell.innerHTML += /* html */ `
					<div class="square">
						<img src='/res/svg/board/dark-square.svg'>
					</div>
					`
				}
				else
				{
					cell.innerHTML += /* html */ `
					<div class="square">
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

		this.boardContainerEl.innerHTML = ''
		this.boardContainerEl.appendChild(this.boardEl)

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
	}
}