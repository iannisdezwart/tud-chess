import express from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import { Game } from './Game.js'

const PORT = +process.argv[2] || 3000
const app = express()
const server = app.listen(PORT, () => console.log(`Server listening on port ${ PORT }`))

app.use(express.static('../front-end'))

const wsServer = new WebSocketServer({ server })

let waitingClient: WebSocket
const games: Map<string, Game> = new Map()

const randomID = () =>
{
	const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
	let id = ''

	for (let i = 0; i < 8; i++)
	{
		id += chars[Math.floor(Math.random() * chars.length)]
	}

	return id
}

const send = (ws: WebSocket, data: any) =>
{
	ws.send(JSON.stringify(data))
}

wsServer.on('connection', ws =>
{
	const respond = (data: any) =>
	{
		send(ws, data)
	}

	ws.on('message', message =>
	{
		let data: any

		try
		{
			data = JSON.parse(message.toString('utf-8'))
		}
		catch
		{
			respond({ error: 'Invalid input' })
			return
		}

		if (data.type == null)
		{
			respond({ error: 'Invalid input' })
			return
		}

		switch (data.type)
		{
			case 'join-game':
			{
				if (waitingClient != null)
				{
					const gameID = randomID()
					const game = new Game(waitingClient, ws)

					games.set(gameID, game)

					send(waitingClient, {
						type: 'game-ready',
						colour: Colour.White,
						gameID
					})

					respond({
						type: 'game-ready',
						colour: Colour.Black,
						gameID
					})

					waitingClient = null
					break
				}

				waitingClient = ws
				break
			}

			case 'move':
			{
				if (data.gameID == null || data.from == null || data.to == null)
				{
					respond({ error: 'Invalid input' })
					break
				}

				const game = games.get(data.gameID)

				if (game == null)
				{
					respond({ error: 'Invalid game ID' })
					break
				}

				// ...
			}
		}
	})
})