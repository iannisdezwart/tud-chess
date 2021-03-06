const ChessPieceType = {
	King: 0,
	Queen: 1,
	Rook: 2,
	Bishop: 3,
	Knight: 4,
	Pawn: 5
}

const Colour = {
	White: 0,
	Black: 1
}

/**
 * Combination of chess piece type and colour.
 */
class ChessPiece
{
	// The type of the piece.
	type

	// The colour of the piece.
	colour

	constructor(type, colour)
	{
		this.type = type
		this.colour = colour
	}

	/**
	 * Returns a one-letter code for the piece.
	 */
	toString()
	{
		if (this.colour == Colour.White)
		{
			switch (this.type)
			{
				case ChessPieceType.King:
				{
					return 'K'
				}

				case ChessPieceType.Queen:
				{
					return 'Q'
				}

				case ChessPieceType.Rook:
				{
					return 'R'
				}

				case ChessPieceType.Bishop:
				{
					return 'B'
				}

				case ChessPieceType.Knight:
				{
					return 'N'
				}

				case ChessPieceType.Pawn:
				{
					return 'P'
				}
			}
		}

		switch (this.type)
		{
			case ChessPieceType.King:
			{
				return 'k'
			}

			case ChessPieceType.Queen:
			{
				return 'q'
			}

			case ChessPieceType.Rook:
			{
				return 'r'
			}

			case ChessPieceType.Bishop:
			{
				return 'b'
			}

			case ChessPieceType.Knight:
			{
				return 'n'
			}

			case ChessPieceType.Pawn:
			{
				return 'p'
			}
		}
	}

	/**
	 * Reads a one-letter code for the piece.
	 */
	static fromString(str)
	{
		switch (str)
		{
			case 'K':
			{
				return new ChessPiece(ChessPieceType.King, Colour.White)
			}

			case 'Q':
			{
				return new ChessPiece(ChessPieceType.Queen, Colour.White)
			}

			case 'R':
			{
				return new ChessPiece(ChessPieceType.Rook, Colour.White)
			}

			case 'B':
			{
				return new ChessPiece(ChessPieceType.Bishop, Colour.White)
			}

			case 'N':
			{
				return new ChessPiece(ChessPieceType.Knight, Colour.White)
			}

			case 'P':
			{
				return new ChessPiece(ChessPieceType.Pawn, Colour.White)
			}

			case 'k':
			{
				return new ChessPiece(ChessPieceType.King, Colour.Black)
			}

			case 'q':
			{
				return new ChessPiece(ChessPieceType.Queen, Colour.Black)
			}

			case 'r':
			{
				return new ChessPiece(ChessPieceType.Rook, Colour.Black)
			}

			case 'b':
			{
				return new ChessPiece(ChessPieceType.Bishop, Colour.Black)
			}

			case 'n':
			{
				return new ChessPiece(ChessPieceType.Knight, Colour.Black)
			}

			case 'p':
			{
				return new ChessPiece(ChessPieceType.Pawn, Colour.Black)
			}
		}

		return null
	}

	/**
	 * Shortcut to check if the piece is a particular piece.
	 */
	is(colour, type)
	{
		return this.colour == colour && this.type == type
	}

	/**
	 * Returns the value of the piece.
	 * Used for determining the score of a position.
	 */
	value()
	{
		switch (this.type)
		{
			case ChessPieceType.King:
			{
				return 0
			}

			case ChessPieceType.Queen:
			{
				return 9
			}

			case ChessPieceType.Rook:
			{
				return 5
			}

			case ChessPieceType.Bishop:
			{
				return 3
			}

			case ChessPieceType.Knight:
			{
				return 3
			}

			case ChessPieceType.Pawn:
			{
				return 1
			}
		}
	}

	/**
	 * Returns a string of an HTML image tag containing an SVG
	 * representation of the piece.
	 */
	svg()
	{
		if (this.colour == Colour.White)
		{
			switch (this.type)
			{
				case ChessPieceType.King:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/king.svg'>
					`
				}

				case ChessPieceType.Queen:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/queen.svg'>
					`
				}

				case ChessPieceType.Rook:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/rook.svg'>
					`
				}

				case ChessPieceType.Bishop:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/bishop.svg'>
					`
				}

				case ChessPieceType.Knight:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/knight.svg'>
					`
				}

				case ChessPieceType.Pawn:
				{
					return /* html */ `
					<img src='/res/svg/pieces/white/pawn.svg'>
					`
				}
			}
		}

		switch (this.type)
		{
			case ChessPieceType.King:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/king.svg'>
				`
			}

			case ChessPieceType.Queen:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/queen.svg'>
				`
			}

			case ChessPieceType.Rook:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/rook.svg'>
				`
			}

			case ChessPieceType.Bishop:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/bishop.svg'>
				`
			}

			case ChessPieceType.Knight:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/knight.svg'>
				`
			}

			case ChessPieceType.Pawn:
			{
				return /* html */ `
				<img src='/res/svg/pieces/black/pawn.svg'>
				`
			}
		}
	}

	/**
	 * Deserialises a piece from a WebSocket.
	 */
	static deserialise(chessPiece)
	{
		return new ChessPiece(chessPiece.type, chessPiece.colour)
	}
}

// Hack to make this script work with both Node.js and the browser.

if (typeof module != 'undefined')
{
	module.exports = {
		ChessPiece,
		ChessPieceType,
		Colour
	}
}