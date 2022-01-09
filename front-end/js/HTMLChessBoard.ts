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
		const target = touch.target as HTMLElement

		if (!target.classList.contains('piece')
			|| !target.classList.contains('selectable'))
		{
			return
		}

		e.preventDefault()

		this.draggingPiece = target
		this.draggingPieceSquare = this.pointedSquare(touch)

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

		e.preventDefault()

		const { clientX, clientY } = touch
		const img = this.draggingPiece.querySelector<HTMLImageElement>('img')
		const rect = this.draggingPiece.getBoundingClientRect()

		const middleX = rect.x + rect.width / 2
		const middleY = rect.y + rect.height / 2

		const x = (clientX - middleX) / rect.width * 100
		const y = (clientY - middleY) / rect.height * 100

		curPointerPos[0] = clientX - document.documentElement.scrollLeft
		curPointerPos[1] = clientY - document.documentElement.scrollTop

		img.style.transform = `translate(${ x }%, ${ y }%)`
		img.style.zIndex = '1'
	}

	/**
	 * Handles the end of a drag.
	 */
	touchUpHandler(touch: Touch, e: Event)
	{
		if (this.draggingPiece == null)
		{
			return
		}

		e.preventDefault()

		curPointerPos[0] = innerWidth / 2
		curPointerPos[1] = innerHeight / 2

		const fromSquare = this.draggingPieceSquare
		const toSquare = this.pointedSquare(touch)

		let moveIsLegal = false

		if (toSquare != null)
		{
			const toSquareEl = this.getSquare(toSquare)
			moveIsLegal = toSquareEl.classList.contains('legal-move')
		}

		const img = this.draggingPiece.querySelector<HTMLImageElement>('img')

		img.style.transform = null
		img.style.zIndex = null
		this.draggingPiece = null

		for (const square of [].slice.call(document.querySelectorAll('.legal-move')))
		{
			square.classList.remove('legal-move')
		}

		if (fromSquare.equals(toSquare) || !moveIsLegal)
		{
			return
		}

		this.board.move(fromSquare, toSquare)
		this.render()
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
					<div class='square'>
						<img src='/res/svg/board/dark-square.svg'>
					</div>
					`
				}
				else
				{
					cell.innerHTML += /* html */ `
					<div class='square'>
						<img src='/res/svg/board/light-square.svg'>
					</div>
					`
				}

				const piece = this.pieceAt(x, y)

				if (piece != null)
				{
					if (this.board.turn == this.player &&
						piece.colour == this.board.turn)
					{
						cell.innerHTML += /* html */ `
						<div class='selectable piece'>
							${ this.pieceAt(x, y).svg() }
						</div>
						`
					}
					else
					{
						cell.innerHTML += /* html */ `
						<div class='piece'>
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