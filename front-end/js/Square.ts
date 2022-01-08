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
}

if (typeof module != 'undefined')
{
	module.exports = Square
}