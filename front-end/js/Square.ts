/**
 * Class representing a 2 dimensional square.
 * Holds the x and y coordinates of the square.
 */
class Square
{
	x: number
	y: number

	constructor(x: number, y: number)
	{
		this.x = x
		this.y = y
	}

	clone()
	{
		return new Square(this.x, this.y)
	}

	equals(other: Square)
	{
		if (other == null)
		{
			return false
		}

		return this.x == other.x && this.y == other.y
	}

	toString()
	{
		return `${ String.fromCharCode('a'.charCodeAt(0) + this.x) }${ this.y + 1 }`
	}

	static deserialise(square: Square)
	{
		return new Square(square.x, square.y)
	}
}

if (typeof module != 'undefined')
{
	module.exports = Square
}