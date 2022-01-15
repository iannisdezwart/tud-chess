import { WebSocket } from 'ws'

/**
 * Sends a message to a websocket.
 * The message is stringified before sending.
 */
export const send = (ws: WebSocket, data: any) =>
{
	console.log(`>>> [WS]`, data)

	ws.send(JSON.stringify(data))
}

/**
 * Sends an error string to a websocket.
 */
export const sendError = (ws: WebSocket, error: string) =>
{
	send(ws, { type: 'error', error })
}

/**
 * Generates a random ID.
 * This is used to get IDs for games and user tokens.
 */
export const randomID = (length: number) =>
{
	const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
	let id = ''

	for (let i = 0; i < length; i++)
	{
		id += chars[Math.floor(Math.random() * chars.length)]
	}

	return id
}