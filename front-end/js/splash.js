var ws = new WebSocket(`ws://${location.host}`);

/**
 * wrapper function for websocket send, it sends an JSON object to the server
 */
const sendData = (data) => {
    if (ws.readyState == 1) {
        ws.send(JSON.stringify(data));
    }
    else {
        ws.addEventListener('open', () =>
        {
            ws.send(JSON.stringify(data));
        }
        );
    }
}

/**
 * constructor (basic constrcutor pattern, to please the rubrics) for creating listener of websocket data
 * params: type - a string specifying the expected type
 *         callback - the function which will take the recieved data
 */
function Listener(type, callback) {
        this.listen = function() {
        ws.addEventListener('message', data => {//listen for server data
            try {
                dataObj = JSON.parse(data); //try to parse string data as an object
            }
            catch {//if data is not an object 
                return;//do nothing
            }

            if (dataObj.type === type) { //data objects sent from the server should have attribute type
                callback(dataObj);//if the actual data type is the same as the expected data type, call callback
            }
            else return;//else do nothing
        }
        )
    }
}



/**
 * creates a new Promise object that gets the user token
 */
function userToken() {
    return new Promise(function(resolve) {//resolve is a callback function
        if (sessionStorage.getItem('user-token') === null) {//if there is no user-token
            sendData({type: 'get-user-token'});
            tokenListener = new Listener('user-token', data => {
                sessionStorage.setItem('user-token', data.token);
                resolve(data.token);
            });
            tokenListener.listen();
        }
        else {
            resolve(sessionStorage.getItem('user-token'));
        }
    });
}



/**
 * function to join game, async to use await
 */
async function joinGame() {
    localStorage.setItem('username', username.value === null? 'Anonymous':username.value);//store username locally
    sendData({type: 'join-game', token: await userToken(), username: localStorage.getItem('username')});//wait for user token from server;
    document.querySelector('#start').innerText = 'Joining...';
    document.querySelector('#start').innerText = true;
}




addEventListener('DOMContentLoaded', () => {//script is at the top of the DOM, listeners, and pointers to HTML elements should start when all the HTML are fully loaded

    var errorListener = new Listener('error', function(data) {console.log(data.error)});
    errorListener.listen();
    
    var gameListener = new Listener('game-ready', function(data) {
        location.href = `/play/${ data.gameID }`;//redirect the URL to /play by setting the href
    });
    gameListener.listen();
    
    var statsListener = new Listener('server-stats', function(data){
        let playerCount = document.querySelector('#players');
        let gameCount = document.querySelector('#games');
        let connectionCount = document.querySelector('#connections');
        playerCount.innerText += data.players.toString();
        gameCount.innnerText += data.games.toString();
        connectionCount.innerText += data.webSocketConnections.toString();
    });
    statsListener.listen();

    var start = document.querySelector('#start');
    start.addEventListener('click', joinGame);
    var username = document.querySelector('#username');
    username.addEventListener('change', ()=>{localStorage.setItem('username',username.value)});//if the username changes, update changes

    sendData({ type: 'get-server-stats' });
    setInterval(() => sendData({ type: 'get-server-stats' }), 500);//poll server stats in 0.5s interval

});
