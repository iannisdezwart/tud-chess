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
}

if (typeof module != 'undefined')
{
	module.exports = {
		ChessPiece,
		ChessPieceType,
		Colour
	}
}