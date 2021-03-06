import express from 'express'
import { WebSocketServer } from 'ws'
import { router } from './express-routes/routes.js'
import { sendError } from './util.js'
import { analyseGame } from './ws-routes/analyse-game.js'
import { getUserToken } from './ws-routes/get-user-token.js'
import { joinGame } from './ws-routes/join-game.js'
import { move } from './ws-routes/move.js'
import { offerDraw } from './ws-routes/offer-draw.js'
import { playGame } from './ws-routes/play-game.js'
import { resign } from './ws-routes/resign.js'
import { serverStats } from './ws-routes/server-stats.js'
import { spectateGame } from './ws-routes/spectate-game.js'

const PORT = +process.argv[2] || 3000

// Create the HTTP server.

const app = express()
const server = app.listen(PORT,
	() => console.log(`Server listening on port ${ PORT }`))

// Use EJS as the view engine.

app.set('view engine', 'ejs')

// Include the static files in the `front-end` directory.

app.use(express.static('../front-end'))

// Register routes to the express app.

app.use(router)

// Start the WebSocket server at the same port as the HTTP server.

export const wsServer = new WebSocketServer({ server })

// Handle new WebSocket connections.

wsServer.on('connection', ws =>
{
	// Handle incoming messages on this new WebSocket.

	ws.on('message', message =>
	{
		// Parse the message.

		let data

		try
		{
			data = JSON.parse(message.toString('utf-8'))
		}
		catch
		{
			// Ignore invalid JSON.

			sendError(ws, 'Invalid JSON input.')
			return
		}

		// Handle missing fields.

		if (data.type == null)
		{
			sendError(ws, 'Missing "type" field.')
			return
		}

		// Handle the message.

		console.log(`<<< [WS]`, data)

		switch (data.type)
		{
			case 'get-user-token':
			{
				getUserToken(ws)
				break
			}

			case 'join-game':
			{
				joinGame(data, ws)
				break
			}

			case 'play-game':
			{
				playGame(data, ws)
				break
			}

			case 'move':
			{
				move(data, ws)
				break
			}

			case 'spectate-game':
			{
				spectateGame(data, ws)
				break
			}

			case 'resign':
			{
				resign(data, ws)
				break
			}

			case 'offer-draw':
			{
				offerDraw(data, ws)
				break
			}

			case 'get-server-stats':
			{
				serverStats(ws)
				break
			}

			case 'analyse-game':
			{
				analyseGame(data, ws)
				break
			}
		}
	})
})