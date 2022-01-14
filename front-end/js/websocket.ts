const scheme = location.protocol == 'https:' ? 'wss' : 'ws'
const ws = new WebSocket(`${ scheme }://${ location.host }`)

/**
 * Sends a WebSocket message to the server.
 */
const send = (data: any) =>
{
	if (ws.readyState == WebSocket.OPEN)
	{
		ws.send(JSON.stringify(data))
		return
	}

	ws.addEventListener('open', () =>
	{
		ws.send(JSON.stringify(data))
	})
}

/**
 * Adds a listener to the WebSocket for a specific message type.
 */
const receive = (type: string, callback: (data: any) => void) =>
{
	ws.addEventListener('message', message =>
	{
		let data: any

		try
		{
			data = JSON.parse(message.data)
		}
		catch
		{
			return
		}

		if (data.type == null || data.type != type)
		{
			return
		}

		callback(data)
	})
}

// Dump WebSocket error messages to the console.

receive('error', data =>
{
	console.error(data.error)
})