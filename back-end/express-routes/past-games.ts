import { Request, Response } from 'express'
import { readDatabase } from '../database.js'

/**
 * Route that displays the past games.
 */
export const pastGamesRoute = async (_req: Request, res: Response) =>
{
	const pastGames = (await readDatabase())
		.map(entry => {
			const winner = entry.winner == Colour.White
				? /* html */ `<span class="winner">${ entry.whiteUsername }</span> (White)`
				: /* html */ `<span class="winner">${ entry.blackUsername }</span> (Black)`

			const date = new Date(entry.dateTime).toUTCString()

			return /* html */ `
			<li>
				<div class="entry-id">Game ID: ${ entry.id }</div>
				<div class="entry-date">Played at ${ date }</div>
				<div class="entry-players">
					<span class="username">${ entry.whiteUsername }</span> (White)
					vs
					<span class="username">${ entry.blackUsername }</span> (Black)
				</div>
				<div class="entry-winner">Winner: ${ winner }</div>
				<a href="/analyse/${ entry.id }" class="analyse">Analyse</a>
			</li>
			`
		})
		.reverse()
		.join('')

	res.render('../views/past-games.ejs', { pastGames })
}