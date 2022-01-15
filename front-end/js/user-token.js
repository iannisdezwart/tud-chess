/**
 * Returns a promise that resolves to the user's token.
 */
const userToken = () => new Promise(resolve =>
{
	if (sessionStorage.getItem('user-token') != null)
	{
		resolve(sessionStorage.getItem('user-token'))
		return
	}

	// Get a user token for the client.

	send({ type: 'get-user-token' })

	receive('user-token', data =>
	{
		sessionStorage.setItem('user-token', data.token)
		resolve(data.token)
	})
})