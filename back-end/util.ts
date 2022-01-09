import { WebSocket } from 'ws'

export const send = (ws: WebSocket, data: any) =>
{
	console.log(`>>> [WS]`, data)

	ws.send(JSON.stringify(data))
}

export const sendError = (ws: WebSocket, error: string) =>
{
	send(ws, { type: 'error', error })
}

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