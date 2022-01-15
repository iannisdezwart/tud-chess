enum ChessPieceType
{
	King,
	Queen,
	Rook,
	Bishop,
	Knight,
	Pawn
}

enum Colour
{
	White,
	Black
}

/**
 * Combination of chess piece type and colour.
 */
class ChessPiece
{
	type: ChessPieceType
	colour: Colour

	constructor(type: ChessPieceType, colour: Colour)
	{
		this.type = type
		this.colour = colour
	}

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

	static fromString(str: string)
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

	is(colour: Colour, type: ChessPieceType)
	{
		return this.colour == colour && this.type == type
	}

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

	static deserialise(chessPiece: ChessPiece)
	{
		return new ChessPiece(chessPiece.type, chessPiece.colour)
	}
}

if (typeof module != 'undefined')
{
	module.exports = {
		ChessPiece,
		ChessPieceType,
		Colour
	}
}