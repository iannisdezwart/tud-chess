// Hack to make this script work with both Node.js and the browser.

if (typeof module != 'undefined')
{
	ChessPiece = require('./ChessPiece.js').ChessPiece
	Colour = require('./ChessPiece.js').Colour
	ChessPieceType = require('./ChessPiece.js').ChessPieceType
	Square = require('./Square.js')
}

/**
 * Class that holds all non-HTML related stuff for a chess board.
 * Holds the pieces, the current turn, and legal stuff.
 */
class ChessBoard
{
	// A two dimensional array of all the squares on the board.
	// Squares that don't contain pieces are null.
	board

	// Flags for castling legality.
	// True means the king can castle in that direction.
	whiteCastleShort
	whiteCastleLong
	blackCastleShort
	blackCastleLong

	// Flags for en passant capture legality.
	// These fields are arrays of size 8, one for each rank.
	// True means the pawn can capture en passant in that rank.
	whiteEnPassant
	blackEnPassant

	// The player whose turn it is to move.
	turn

	// The turn number. The first turn is 0.
	turnNumber

	constructor()
	{
		this.board = []

		this.whiteCastleShort = true
		this.whiteCastleLong = true

		this.blackCastleShort = true
		this.blackCastleLong = true

		this.whiteEnPassant = Array(8).fill(false)
		this.blackEnPassant = Array(8).fill(false)

		this.turn = Colour.White
		this.turnNumber = 0
	}

	/**
	 * Returns a board state string.
	 */
	boardStateString()
	{
		const {
			board,
			whiteCastleShort,
			whiteCastleLong,
			blackCastleShort,
			blackCastleLong,
			whiteEnPassant,
			blackEnPassant,
			turn
		} = this

		return JSON.stringify({
			board,
			whiteCastleShort,
			whiteCastleLong,
			blackCastleShort,
			blackCastleLong,
			whiteEnPassant,
			blackEnPassant,
			turn
		})
	}

	/**
	 * Serialises the chess board so it can be sent through a WebSocket.
	 */
	serialise()
	{
		let boardString = ''

		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.board[y][x]

				if (piece == null)
				{
					boardString += ' '
					continue
				}

				boardString += piece.toString()
			}
		}

		const {
			whiteCastleShort,
			whiteCastleLong,
			blackCastleShort,
			blackCastleLong,
			whiteEnPassant,
			blackEnPassant,
			turn,
			turnNumber
		} = this

		return {
			board: boardString,
			whiteCastleShort,
			whiteCastleLong,
			blackCastleShort,
			blackCastleLong,
			whiteEnPassant,
			blackEnPassant,
			turn,
			turnNumber
		}
	}

	/**
	 * Deserialises a chess board serialised using `ChessBoard.serialise()`.
	 * This allows a chess board to be deserialised from a WebSocket.
	 */
	static deserialise(serialisedBoard)
	{
		const board = new ChessBoard()

		for (let y = 0; y < 8; y++)
		{
			const row = []

			for (let x = 0; x < 8; x++)
			{
				const piece = ChessPiece.fromString(
					serialisedBoard.board[8 * y + x])
				row.push(piece)
			}

			board.board.push(row)
		}

		board.whiteCastleShort = serialisedBoard.whiteCastleShort
		board.whiteCastleLong = serialisedBoard.whiteCastleLong

		board.blackCastleShort = serialisedBoard.blackCastleShort
		board.blackCastleLong = serialisedBoard.blackCastleLong

		board.whiteEnPassant = serialisedBoard.whiteEnPassant
		board.blackEnPassant = serialisedBoard.blackEnPassant

		board.turn = serialisedBoard.turn
		board.turnNumber = serialisedBoard.turnNumber

		return board
	}

	/**
	 * Returns the piece at the given square.
	 */
	pieceAt(x, y)
	{
		return this.board[y][x]
	}

	/**
	 * Sets the piece at the given square.
	 */
	setAt(x, y, piece)
	{
		this.board[y][x] = piece
	}

	/**
	 * Decodes a human readable chess coordinate to square indices.
	 */
	decodeCoord(coord)
	{
		const x = coord.charCodeAt(0) - 'a'.charCodeAt(0)
		const y = coord.charCodeAt(1) - '1'.charCodeAt(0)

		return [ x, y ]
	}

	/**
	 * Returns the colour of the given square.
	 */
	squareColour(x, y)
	{
		if ((x + y) % 2 == 0)
		{
			return Colour.Black
		}

		return Colour.White
	}

	/**
	 * Sets a piece at a given human readable chess coordinate.
	 */
	set(coord, pieceType, colour)
	{
		const [ x, y ] = this.decodeCoord(coord)

		this.board[y][x] = new ChessPiece(pieceType, colour)
	}

	/**
	 * Counts the number of pieces on the board.
	 * Useful for checking if a piece has been captured,
	 * which is used for determining if the fifty move rule applies.
	 */
	countPieces()
	{
		let count = 0

		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				if (this.board[y][x] != null)
				{
					count++
				}
			}
		}

		return count
	}

	/**
	 * Computes the score of the board.
	 */
	computeScore()
	{
		let whitePawns = 0
		let whiteKnights = 0
		let whiteBishops = 0
		let whiteRooks = 0
		let whiteQueens = 0

		let blackPawns = 0
		let blackKnights = 0
		let blackBishops = 0
		let blackRooks = 0
		let blackQueens = 0

		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.board[y][x]

				if (piece == null)
				{
					continue
				}

				if (piece.is(Colour.White, ChessPieceType.Pawn))
				{
					whitePawns++
				}
				else if (piece.is(Colour.White, ChessPieceType.Knight))
				{
					whiteKnights++
				}
				else if (piece.is(Colour.White, ChessPieceType.Bishop))
				{
					whiteBishops++
				}
				else if (piece.is(Colour.White, ChessPieceType.Rook))
				{
					whiteRooks++
				}
				else if (piece.is(Colour.White, ChessPieceType.Queen))
				{
					whiteQueens++
				}
				else if (piece.is(Colour.Black, ChessPieceType.Pawn))
				{
					blackPawns++
				}
				else if (piece.is(Colour.Black, ChessPieceType.Knight))
				{
					blackKnights++
				}
				else if (piece.is(Colour.Black, ChessPieceType.Bishop))
				{
					blackBishops++
				}
				else if (piece.is(Colour.Black, ChessPieceType.Rook))
				{
					blackRooks++
				}
				else if (piece.is(Colour.Black, ChessPieceType.Queen))
				{
					blackQueens++
				}
			}
		}

		const whitePawnsEaten   = Math.max(0, 8 - whitePawns)
		const whiteKnightsEaten = Math.max(0, 2 - whiteKnights)
		const whiteBishopsEaten = Math.max(0, 2 - whiteBishops)
		const whiteRooksEaten   = Math.max(0, 2 - whiteRooks)
		const whiteQueensEaten  = Math.max(0, 1 - whiteQueens)

		const blackPawnsEaten   = Math.max(0, 8 - blackPawns)
		const blackKnightsEaten = Math.max(0, 2 - blackKnights)
		const blackBishopsEaten = Math.max(0, 2 - blackBishops)
		const blackRooksEaten   = Math.max(0, 2 - blackRooks)
		const blackQueensEaten  = Math.max(0, 1 - blackQueens)

		const whiteScore = whitePawnsEaten + 3 * whiteKnightsEaten
			+ 3 * whiteBishopsEaten    + 5 * whiteRooksEaten
			+ 9 * whiteQueensEaten

		const blackScore = blackPawnsEaten + 3 * blackKnightsEaten
			+ 3 * blackBishopsEaten    + 5 * blackRooksEaten
			+ 9 * blackQueensEaten

		return {
			whiteScore,
			whitePawnsEaten,
			whiteKnightsEaten,
			whiteBishopsEaten,
			whiteRooksEaten,
			whiteQueensEaten,

			blackScore,
			blackPawnsEaten,
			blackKnightsEaten,
			blackBishopsEaten,
			blackRooksEaten,
			blackQueensEaten,
		}
	}

	/**
	 * Returns a boolean indicating whether white is in check.
	 */
	whiteInCheck()
	{
		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.pieceAt(x, y)

				if (piece != null && piece.colour == Colour.Black)
				{
					const moves = this.possibleMoves(x, y, false)

					for (const move of moves)
					{
						const piece = this.pieceAt(move.x, move.y)

						if (piece != null && piece.is(
							Colour.White, ChessPieceType.King))
						{
							return true
						}
					}
				}
			}
		}

		return false
	}

	/**
	 * Returns a boolean indicating whether black is in check.
	 */
	blackInCheck()
	{
		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.pieceAt(x, y)

				if (piece != null && piece.colour == Colour.White)
				{
					const moves = this.possibleMoves(x, y, false)

					for (const move of moves)
					{
						const piece = this.pieceAt(move.x, move.y)

						if (piece != null && piece.is(
							Colour.Black, ChessPieceType.King))
						{
							return true
						}
					}
				}
			}
		}

		return false
	}

	/**
	 * Returns a boolean indicating whether white can move.
	 */
	whiteCanMove()
	{
		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.pieceAt(x, y)

				if (piece != null && piece.colour == Colour.White)
				{
					const moves = this.possibleMoves(x, y, true)

					if (moves.length > 0)
					{
						return true
					}
				}
			}
		}

		return false
	}

	/**
	 * Returns a boolean indicating whether black can move.
	 */
	blackCanMove()
	{
		for (let y = 0; y < 8; y++)
		{
			for (let x = 0; x < 8; x++)
			{
				const piece = this.pieceAt(x, y)

				if (piece != null && piece.colour == Colour.Black)
				{
					const moves = this.possibleMoves(x, y, true)

					if (moves.length > 0)
					{
						return true
					}
				}
			}
		}

		return false
	}

	/**
	 * Returns a boolean indicating whether the game has ended.
	 */
	ended()
	{
		if (this.turn == Colour.White && !this.whiteCanMove())
		{
			return true
		}

		if (this.turn == Colour.Black && !this.blackCanMove())
		{
			return true
		}

		return false
	}

	/**
	 * Returns an array of all possible moves for a given piece.
	 */
	possibleMoves(x, y, checkCheck)
	{
		const moves = []

		if (x >= 8 || y >= 8 || x < 0 || y < 0)
		{
			return moves
		}

		const piece = this.pieceAt(x, y)

		if (piece == null)
		{
			return moves
		}

		if (piece.is(Colour.White, ChessPieceType.Pawn))
		{
			if (this.pieceAt(x, y + 1) == null)
			{
				if (!checkCheck || this.isLegal(x, y, x, y + 1))
				{
					moves.push(new Square(x, y + 1))
				}

				if (y == 1 && this.pieceAt(x, y + 2) == null)
				{
					if (!checkCheck || this.isLegal(x, y, x, y + 2))
					{
						moves.push(new Square(x, y + 2))
					}
				}
			}

			const leftCapture = this.pieceAt(x - 1, y + 1)

			if (leftCapture != null && leftCapture.colour == Colour.Black)
			{
				if (!checkCheck || this.isLegal(x, y, x - 1, y + 1))
				{
					moves.push(new Square(x - 1, y + 1))
				}
			}

			const rightCapture = this.pieceAt(x + 1, y + 1)

			if (rightCapture != null && rightCapture.colour == Colour.Black)
			{
				if (!checkCheck || this.isLegal(x, y, x + 1, y + 1))
				{
					moves.push(new Square(x + 1, y + 1))
				}
			}

			const leftEnPassant = this.pieceAt(x - 1, y)

			if (leftEnPassant != null
				&& leftEnPassant.is(Colour.Black, ChessPieceType.Pawn)
				&& this.blackEnPassant[x - 1])
			{
				if (!checkCheck || this.isLegal(x, y, x - 1, y + 1))
				{
					moves.push(new Square(x - 1, y + 1))
				}
			}

			const rightEnPassant = this.pieceAt(x + 1, y)

			if (rightEnPassant != null
				&& rightEnPassant.is(Colour.Black, ChessPieceType.Pawn)
				&& this.blackEnPassant[x + 1])
			{
				if (!checkCheck || this.isLegal(x, y, x + 1, y + 1))
				{
					moves.push(new Square(x + 1, y + 1))
				}
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.Pawn))
		{
			if (this.pieceAt(x, y - 1) == null)
			{
				if (!checkCheck || this.isLegal(x, y, x, y - 1))
				{
					moves.push(new Square(x, y - 1))
				}

				if (y == 6 && this.pieceAt(x, y - 2) == null)
				{
					if (!checkCheck || this.isLegal(x, y, x, y - 2))
					{
						moves.push(new Square(x, y - 2))
					}
				}
			}

			const leftCapture = this.pieceAt(x - 1, y - 1)

			if (leftCapture != null && leftCapture.colour == Colour.White)
			{
				if (!checkCheck || this.isLegal(x, y, x - 1, y - 1))
				{
					moves.push(new Square(x - 1, y - 1))
				}
			}

			const rightCapture = this.pieceAt(x + 1, y - 1)

			if (rightCapture != null && rightCapture.colour == Colour.White)
			{
				if (!checkCheck || this.isLegal(x, y, x + 1, y - 1))
				{
					moves.push(new Square(x + 1, y - 1))
				}
			}

			const leftEnPassant = this.pieceAt(x - 1, y)

			if (leftEnPassant != null
				&& leftEnPassant.is(Colour.White, ChessPieceType.Pawn)
				&& this.whiteEnPassant[x - 1])
			{
				if (!checkCheck || this.isLegal(x, y, x - 1, y - 1))
				{
					moves.push(new Square(x - 1, y - 1))
				}
			}

			const rightEnPassant = this.pieceAt(x + 1, y)

			if (rightEnPassant != null
				&& rightEnPassant.is(Colour.White, ChessPieceType.Pawn)
				&& this.whiteEnPassant[x + 1])
			{
				if (!checkCheck || this.isLegal(x, y, x + 1, y - 1))
				{
					moves.push(new Square(x + 1, y - 1))
				}
			}
		}

		if (piece.is(Colour.White, ChessPieceType.Bishop))
		{
			let diag = new Square(x + 1, y + 1)

			while (diag.x < 8 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x++
				diag.y++
			}

			diag = new Square(x + 1, y - 1)

			while (diag.x < 8 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x++
				diag.y--
			}

			diag = new Square(x - 1, y + 1)

			while (diag.x >= 0 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x--
				diag.y++
			}

			diag = new Square(x - 1, y - 1)

			while (diag.x >= 0 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x--
				diag.y--
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.Bishop))
		{
			let diag = new Square(x + 1, y + 1)

			while (diag.x < 8 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x++
				diag.y++
			}

			diag = new Square(x + 1, y - 1)

			while (diag.x < 8 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x++
				diag.y--
			}

			diag = new Square(x - 1, y + 1)

			while (diag.x >= 0 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x--
				diag.y++
			}

			diag = new Square(x - 1, y - 1)

			while (diag.x >= 0 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x--
				diag.y--
			}
		}

		if (piece.is(Colour.White, ChessPieceType.Knight))
		{
			if (x - 1 >= 0 && y - 2 >= 0)
			{
				const piece = this.pieceAt(x - 1, y - 2)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y - 2))
					{
						moves.push(new Square(x - 1, y - 2))
					}
				}
			}

			if (x - 2 >= 0 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x - 2, y - 1)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 2, y - 1))
					{
						moves.push(new Square(x - 2, y - 1))
					}
				}
			}

			if (x + 1 < 8 && y - 2 >= 0)
			{
				const piece = this.pieceAt(x + 1, y - 2)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y - 2))
					{
						moves.push(new Square(x + 1, y - 2))
					}
				}
			}

			if (x + 2 < 8 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x + 2, y - 1)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 2, y - 1))
					{
						moves.push(new Square(x + 2, y - 1))
					}
				}
			}

			if (x - 1 >= 0 && y + 2 < 8)
			{
				const piece = this.pieceAt(x - 1, y + 2)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y + 2))
					{
						moves.push(new Square(x - 1, y + 2))
					}
				}
			}

			if (x - 2 >= 0 && y + 1 < 8)
			{
				const piece = this.pieceAt(x - 2, y + 1)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 2, y + 1))
					{
						moves.push(new Square(x - 2, y + 1))
					}
				}
			}

			if (x + 1 < 8 && y + 2 < 8)
			{
				const piece = this.pieceAt(x + 1, y + 2)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y + 2))
					{
						moves.push(new Square(x + 1, y + 2))
					}
				}
			}

			if (x + 2 < 8 && y + 1 < 8)
			{
				const piece = this.pieceAt(x + 2, y + 1)

				if (piece == null || piece.colour != Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 2, y + 1))
					{
						moves.push(new Square(x + 2, y + 1))
					}
				}
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.Knight))
		{
			if (x - 1 >= 0 && y - 2 >= 0)
			{
				const piece = this.pieceAt(x - 1, y - 2)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y - 2))
					{
						moves.push(new Square(x - 1, y - 2))
					}
				}
			}

			if (x - 2 >= 0 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x - 2, y - 1)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 2, y - 1))
					{
						moves.push(new Square(x - 2, y - 1))
					}
				}
			}

			if (x + 1 < 8 && y - 2 >= 0)
			{
				const piece = this.pieceAt(x + 1, y - 2)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y - 2))
					{
						moves.push(new Square(x + 1, y - 2))
					}
				}
			}

			if (x + 2 < 8 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x + 2, y - 1)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 2, y - 1))
					{
						moves.push(new Square(x + 2, y - 1))
					}
				}
			}

			if (x - 1 >= 0 && y + 2 < 8)
			{
				const piece = this.pieceAt(x - 1, y + 2)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y + 2))
					{
						moves.push(new Square(x - 1, y + 2))
					}
				}
			}

			if (x - 2 >= 0 && y + 1 < 8)
			{
				const piece = this.pieceAt(x - 2, y + 1)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 2, y + 1))
					{
						moves.push(new Square(x - 2, y + 1))
					}
				}
			}

			if (x + 1 < 8 && y + 2 < 8)
			{
				const piece = this.pieceAt(x + 1, y + 2)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y + 2))
					{
						moves.push(new Square(x + 1, y + 2))
					}
				}
			}

			if (x + 2 < 8 && y + 1 < 8)
			{
				const piece = this.pieceAt(x + 2, y + 1)

				if (piece == null || piece.colour != Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 2, y + 1))
					{
						moves.push(new Square(x + 2, y + 1))
					}
				}
			}
		}

		if (piece.is(Colour.White, ChessPieceType.Rook))
		{
			let line = new Square(x + 1, y)

			while (line.x < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.x++
			}

			line = new Square(x - 1, y)

			while (line.x >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.x--
			}

			line = new Square(x, y + 1)

			while (line.y < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.y++
			}

			line = new Square(x, y - 1)

			while (line.y >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.y--
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.Rook))
		{
			let line = new Square(x + 1, y)

			while (line.x < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.x++
			}

			line = new Square(x - 1, y)

			while (line.x >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.x--
			}

			line = new Square(x, y + 1)

			while (line.y < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.y++
			}

			line = new Square(x, y - 1)

			while (line.y >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.y--
			}
		}

		if (piece.is(Colour.White, ChessPieceType.Queen))
		{
			let diag = new Square(x + 1, y + 1)

			while (diag.x < 8 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x++
				diag.y++
			}

			diag = new Square(x - 1, y - 1)

			while (diag.x >= 0 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x--
				diag.y--
			}

			diag = new Square(x + 1, y - 1)

			while (diag.x < 8 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x++
				diag.y--
			}

			diag = new Square(x - 1, y + 1)

			while (diag.x >= 0 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				diag.x--
				diag.y++
			}

			let line = new Square(x + 1, y)

			while (line.x < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.x++
			}

			line = new Square(x - 1, y)

			while (line.x >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.x--
			}

			line = new Square(x, y + 1)

			while (line.y < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.y++
			}

			line = new Square(x, y - 1)

			while (line.y >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				line.y--
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.Queen))
		{
			let diag = new Square(x + 1, y + 1)

			while (diag.x < 8 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x++
				diag.y++
			}

			diag = new Square(x - 1, y - 1)

			while (diag.x >= 0 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x--
				diag.y--
			}

			diag = new Square(x + 1, y - 1)

			while (diag.x < 8 && diag.y >= 0)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x++
				diag.y--
			}

			diag = new Square(x - 1, y + 1)

			while (diag.x >= 0 && diag.y < 8)
			{
				const piece = this.pieceAt(diag.x, diag.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, diag.x, diag.y))
				{
					moves.push(diag.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				diag.x--
				diag.y++
			}

			let line = new Square(x + 1, y)

			while (line.x < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.x++
			}

			line = new Square(x - 1, y)

			while (line.x >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.x--
			}

			line = new Square(x, y + 1)

			while (line.y < 8)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.y++
			}

			line = new Square(x, y - 1)

			while (line.y >= 0)
			{
				const piece = this.pieceAt(line.x, line.y)

				if (piece != null && piece.colour == Colour.Black)
				{
					break
				}

				if (!checkCheck || this.isLegal(x, y, line.x, line.y))
				{
					moves.push(line.clone())
				}

				if (piece != null && piece.colour == Colour.White)
				{
					break
				}

				line.y--
			}
		}

		if (piece.is(Colour.White, ChessPieceType.King))
		{
			if (x + 1 < 8 && y + 1 < 8)
			{
				const piece = this.pieceAt(x + 1, y + 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y + 1))
					{
						moves.push(new Square(x + 1, y + 1))
					}
				}
			}

			if (x + 1 < 8 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x + 1, y - 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y - 1))
					{
						moves.push(new Square(x + 1, y - 1))
					}
				}
			}

			if (x - 1 >= 0 && y + 1 < 8)
			{
				const piece = this.pieceAt(x - 1, y + 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y + 1))
					{
						moves.push(new Square(x - 1, y + 1))
					}
				}
			}

			if (x - 1 >= 0 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x - 1, y - 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y - 1))
					{
						moves.push(new Square(x - 1, y - 1))
					}
				}
			}

			if (x + 1 < 8)
			{
				const piece = this.pieceAt(x + 1, y)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y))
					{
						moves.push(new Square(x + 1, y))
					}
				}
			}

			if (x - 1 >= 0)
			{
				const piece = this.pieceAt(x - 1, y)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y))
					{
						moves.push(new Square(x - 1, y))
					}
				}
			}

			if (y + 1 < 8)
			{
				const piece = this.pieceAt(x, y + 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x, y + 1))
					{
						moves.push(new Square(x, y + 1))
					}
				}
			}

			if (y - 1 >= 0)
			{
				const piece = this.pieceAt(x, y - 1)

				if (piece == null || piece.colour == Colour.Black)
				{
					if (!checkCheck || this.isLegal(x, y, x, y - 1))
					{
						moves.push(new Square(x, y - 1))
					}
				}
			}

			if (this.whiteCastleShort
				&& this.pieceAt(x + 1, y) == null
				&& this.pieceAt(x + 2, y) == null
				&& checkCheck
				&& !this.whiteInCheck()
				&& this.isLegal(x, y, x + 1, y)
				&& this.isLegal(x, y, x + 2, y))
			{
				moves.push(new Square(x + 2, y))
			}

			if (this.whiteCastleLong
				&& this.pieceAt(x - 1, y) == null
				&& this.pieceAt(x - 2, y) == null
				&& this.pieceAt(x - 3, y) == null
				&& checkCheck
				&& !this.whiteInCheck()
				&& this.isLegal(x, y, x - 1, y)
				&& this.isLegal(x, y, x - 2, y)
				&& this.isLegal(x, y, x - 3, y))
			{
				moves.push(new Square(x - 2, y))
			}
		}

		if (piece.is(Colour.Black, ChessPieceType.King))
		{
			if (x + 1 < 8 && y + 1 < 8)
			{
				const piece = this.pieceAt(x + 1, y + 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y + 1))
					{
						moves.push(new Square(x + 1, y + 1))
					}
				}
			}

			if (x + 1 < 8 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x + 1, y - 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y - 1))
					{
						moves.push(new Square(x + 1, y - 1))
					}
				}
			}

			if (x - 1 >= 0 && y + 1 < 8)
			{
				const piece = this.pieceAt(x - 1, y + 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y + 1))
					{
						moves.push(new Square(x - 1, y + 1))
					}
				}
			}

			if (x - 1 >= 0 && y - 1 >= 0)
			{
				const piece = this.pieceAt(x - 1, y - 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y - 1))
					{
						moves.push(new Square(x - 1, y - 1))
					}
				}
			}

			if (x + 1 < 8)
			{
				const piece = this.pieceAt(x + 1, y)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x + 1, y))
					{
						moves.push(new Square(x + 1, y))
					}
				}
			}

			if (x - 1 >= 0)
			{
				const piece = this.pieceAt(x - 1, y)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x - 1, y))
					{
						moves.push(new Square(x - 1, y))
					}
				}
			}

			if (y + 1 < 8)
			{
				const piece = this.pieceAt(x, y + 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x, y + 1))
					{
						moves.push(new Square(x, y + 1))
					}
				}
			}

			if (y - 1 >= 0)
			{
				const piece = this.pieceAt(x, y - 1)

				if (piece == null || piece.colour == Colour.White)
				{
					if (!checkCheck || this.isLegal(x, y, x, y - 1))
					{
						moves.push(new Square(x, y - 1))
					}
				}
			}

			if (this.blackCastleShort
				&& this.pieceAt(x + 1, y) == null
				&& this.pieceAt(x + 2, y) == null
				&& checkCheck
				&& !this.blackInCheck()
				&& this.isLegal(x, y, x + 1, y)
				&& this.isLegal(x, y, x + 2, y))
			{
				moves.push(new Square(x + 2, y))
			}

			if (this.blackCastleLong
				&& this.pieceAt(x - 1, y) == null
				&& this.pieceAt(x - 2, y) == null
				&& this.pieceAt(x - 3, y) == null
				&& checkCheck
				&& !this.blackInCheck()
				&& this.isLegal(x, y, x - 1, y)
				&& this.isLegal(x, y, x - 2, y)
				&& this.isLegal(x, y, x - 3, y))
			{
				moves.push(new Square(x - 2, y))
			}
		}

		return moves
	}

	/**
	 * Pretends to move a piece from one square to another.
	 * Used for checking if a move is legal.
	 */
	pretend(from, to)
	{
		const oldPiece = this.pieceAt(to.x, to.y)
		const movedPiece = this.pieceAt(from.x, from.y)

		this.setAt(from.x, from.y, null)
		this.setAt(to.x, to.y, movedPiece)

		return oldPiece
	}

	/**
	 * Undoes `ChessBoard.pretend()`.
	 */
	unpretend(from, to, oldPiece)
	{
		this.setAt(from.x, from.y, this.pieceAt(to.x, to.y))
		this.setAt(to.x, to.y, oldPiece)
	}

	/**
	 * Checks if a move is legal.
	 */
	isLegal(xFrom, yFrom, xTo, yTo)
	{
		const from = new Square(xFrom, yFrom)
		const to = new Square(xTo, yTo)

		const oldPiece = this.pretend(from, to)

		let check = false

		if (this.turn == Colour.White)
		{
			check = this.whiteInCheck()
		}
		else
		{
			check = this.blackInCheck()
		}

		this.unpretend(from, to, oldPiece)

		return !check
	}

	/**
	 * Performs a move on the board.
	 * Returns the squares that were changed.
	 */
	async move(fromSquare, toSquare, promotion)
	{
		const { x: xFrom, y: yFrom } = fromSquare
		const { x: xTo, y: yTo } = toSquare

		const changedSquares = []

		if (!this.isLegal(xFrom, yFrom, xTo, yTo))
		{
			return changedSquares
		}

		const movedPiece = this.board[yFrom][xFrom]

		this.board[yTo][xTo] = movedPiece
		this.board[yFrom][xFrom] = null

		changedSquares.push(new Square(xFrom, yFrom))
		changedSquares.push(new Square(xTo, yTo))

		// Castling

		if (movedPiece.is(Colour.White, ChessPieceType.King) && xFrom - xTo == 2)
		{
			this.board[yTo][3] = new ChessPiece(ChessPieceType.Rook, Colour.White)
			this.board[yTo][0] = null

			changedSquares.push(new Square(3, yTo))
			changedSquares.push(new Square(0, yTo))
		}

		if (movedPiece.is(Colour.White, ChessPieceType.King) && xTo - xFrom == 2)
		{
			this.board[yTo][5] = new ChessPiece(ChessPieceType.Rook, Colour.White)
			this.board[yTo][7] = null

			changedSquares.push(new Square(5, yTo))
			changedSquares.push(new Square(7, yTo))
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.King) && xFrom - xTo == 2)
		{
			this.board[yTo][3] = new ChessPiece(ChessPieceType.Rook, Colour.Black)
			this.board[yTo][0] = null

			changedSquares.push(new Square(3, yTo))
			changedSquares.push(new Square(0, yTo))
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.King) && xTo - xFrom == 2)
		{
			this.board[yTo][5] = new ChessPiece(ChessPieceType.Rook, Colour.Black)
			this.board[yTo][7] = null

			changedSquares.push(new Square(5, yTo))
			changedSquares.push(new Square(7, yTo))
		}

		// Keep track of castling legality

		if (movedPiece.is(Colour.White, ChessPieceType.King))
		{
			this.whiteCastleShort = false
			this.whiteCastleLong = false
		}

		if (this.whiteCastleShort
			&& movedPiece.is(Colour.White, ChessPieceType.Rook)
			&& xFrom == 0 && this.pieceAt(7, 0) == null)
		{
			this.whiteCastleShort = false
		}

		if (this.whiteCastleLong
			&& movedPiece.is(Colour.White, ChessPieceType.Rook)
			&& xFrom == 7 && this.pieceAt(0, 0) == null)
		{
			this.whiteCastleLong = false
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.King))
		{
			this.blackCastleShort = false
			this.blackCastleLong = false
		}

		if (this.blackCastleShort
			&& movedPiece.is(Colour.Black, ChessPieceType.Rook)
			&& xFrom == 0 && this.pieceAt(0, 7) == null)
		{
			this.blackCastleShort = false
		}

		if (this.blackCastleLong
			&& movedPiece.is(Colour.Black, ChessPieceType.Rook)
			&& xFrom == 7 && this.pieceAt(7, 7) == null)
		{
			this.blackCastleLong = false
		}

		// En passant

		if (this.turn == Colour.White)
		{
			this.whiteEnPassant = Array(8).fill(false)
		}
		else
		{
			this.blackEnPassant = Array(8).fill(false)
		}

		if (movedPiece.is(Colour.White, ChessPieceType.Pawn)
			&& yTo - yFrom == 2)
		{
			this.whiteEnPassant[xFrom] = true
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.Pawn)
			&& yFrom - yTo == 2)
		{
			this.blackEnPassant[xFrom] = true
		}

		if (movedPiece.is(Colour.White, ChessPieceType.Pawn)
			&& this.blackEnPassant[xTo]
			&& xTo != xFrom)
		{
			this.board[yFrom][xTo] = null

			changedSquares.push(new Square(xTo, yFrom))
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.Pawn)
			&& this.whiteEnPassant[xTo]
			&& xTo != xFrom)
		{
			this.board[yFrom][xTo] = null

			changedSquares.push(new Square(xTo, yFrom))
		}

		// Pawn promotion

		if (movedPiece.is(Colour.White, ChessPieceType.Pawn) && yTo == 7)
		{
			switch (await promotion())
			{
				case ChessPieceType.Queen:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Queen, Colour.White)
					break
				}

				case ChessPieceType.Rook:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Rook, Colour.White)
					break
				}

				case ChessPieceType.Bishop:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Bishop, Colour.White)
					break
				}

				case ChessPieceType.Knight:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Knight, Colour.White)
					break
				}
			}
		}

		if (movedPiece.is(Colour.Black, ChessPieceType.Pawn) && yTo == 0)
		{
			switch (await promotion())
			{
				case ChessPieceType.Queen:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Queen, Colour.Black)
					break
				}

				case ChessPieceType.Rook:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Rook, Colour.Black)
					break
				}

				case ChessPieceType.Bishop:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Bishop, Colour.Black)
					break
				}

				case ChessPieceType.Knight:
				{
					this.board[yTo][xTo] = new ChessPiece(
						ChessPieceType.Knight, Colour.Black)
					break
				}
			}
		}

		// Update turn.

		this.turn = this.turn == Colour.White
			? Colour.Black : Colour.White

		this.turnNumber++

		return changedSquares
	}

	/**
	 * Generates an empty chess board.
	 */
	static empty()
	{
		const board = new ChessBoard()

		board.board = []

		for (let y = 0; y < 8; y++)
		{
			board.board.push(new Array(8).fill(null))
		}

		return board
	}

	/**
	 * Generates a chess board with the standard starting position.
	 */
	static generateDefault()
	{
		const board = ChessBoard.empty()

		// White back rank.

		board.set('a1', ChessPieceType.Rook, Colour.White)
		board.set('b1', ChessPieceType.Knight, Colour.White)
		board.set('c1', ChessPieceType.Bishop, Colour.White)
		board.set('d1', ChessPieceType.Queen, Colour.White)
		board.set('e1', ChessPieceType.King, Colour.White)
		board.set('f1', ChessPieceType.Bishop, Colour.White)
		board.set('g1', ChessPieceType.Knight, Colour.White)
		board.set('h1', ChessPieceType.Rook, Colour.White)

		// White pawn rank.

		for (const coord of [ 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2' ])
		{
			board.set(coord, ChessPieceType.Pawn, Colour.White)
		}


		// Black pawn rank.

		for (const coord of [ 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7' ])
		{
			board.set(coord, ChessPieceType.Pawn, Colour.Black)
		}

		// Black back rank.

		board.set('a8', ChessPieceType.Rook, Colour.Black)
		board.set('b8', ChessPieceType.Knight, Colour.Black)
		board.set('c8', ChessPieceType.Bishop, Colour.Black)
		board.set('d8', ChessPieceType.Queen, Colour.Black)
		board.set('e8', ChessPieceType.King, Colour.Black)
		board.set('f8', ChessPieceType.Bishop, Colour.Black)
		board.set('g8', ChessPieceType.Knight, Colour.Black)
		board.set('h8', ChessPieceType.Rook, Colour.Black)

		return board
	}
}

// Hack to make this script work with both Node.js and the browser.

if (typeof module != 'undefined')
{
	module.exports = ChessBoard
}