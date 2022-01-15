/**
 * Class representing a 2 dimensional square.
 * Holds the x and y coordinates of the square.
 */
class Square
{
	// The coordinates of the square.
	x
	y

	constructor(x, y)
	{
		this.x = x
		this.y = y
	}

	/**
	 * Clones the square so we don't modify the original.
	 */
	clone()
	{
		return new Square(this.x, this.y)
	}

	/**
	 * Checks if the square is equal to another square.
	 */
	equals(other)
	{
		if (other == null)
		{
			return false
		}

		return this.x == other.x && this.y == other.y
	}

	/**
	 * Returns a human readable string representation of the square.
	 */
	toString()
	{
		return `${ String.fromCharCode('a'.charCodeAt(0) + this.x) }${ this.y + 1 }`
	}

	/**
	 * Deserialises a square from a WebSocket.
	 */
	static deserialise(square)
	{
		return new Square(square.x, square.y)
	}
}

// Hack to make this script work with both Node.js and the browser.

if (typeof module != 'undefined')
{
	module.exports = Square
}