let board: HTMLChessBoard

addEventListener('DOMContentLoaded', () => {
	const boardContainerEl = document.querySelector('.chess-board-container') as HTMLElement
	board = new HTMLChessBoard(boardContainerEl, Colour.White)
	board.render()
})

const curPointerPos = [ innerWidth / 2, innerHeight / 2 ]

addEventListener('mousemove', e =>
{
	curPointerPos[0] = e.clientX
	curPointerPos[1] = e.clientY
})