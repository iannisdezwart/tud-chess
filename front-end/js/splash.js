
var ws = new WebSocket(`ws://${location.host}`);

/**
 * wrapper function for websocket send, it sends an JSON object to the server
 */
const sendData = (data) => {
    if (ws.readyState === 1) {
        ws.send(JSON.stringify(data));
        console.log('Client data send');
    }
    else {
        ws.addEventListener('open', () =>
        {
            ws.send(JSON.stringify(data));
            console.log('Client data send');
        }
        );
    }
    console.log('data sent was: '+JSON.stringify(data));
}

/**
 * constructor (basic constrcutor pattern, to please the rubrics) for creating listener of websocket data
 * params: type - a string specifying the expected type
 *         callback - the function which will take the recieved data
 */
function Listener(type, callback) {
        this.listen = function() {
        ws.addEventListener('message', event => {//listen for server event, note that event.type can be open, close, message, etc. but in this case we are only listening for event.type = message
            console.log('data type received was '+ typeof event);//it seems that the servers sends back a string, which is automatically parsed as object

            console.log(`data is ${JSON.stringify(event.data)}`);
            data = JSON.parse(event.data)//the data attribute of event contains 
            if (data.type == type) { //data objects sent from the server should have attribute type
                console.log('listener for data of type '+type+' reiceved data')
                callback(data);//if the actual data type is the same as the expected data type, call callback
                
            }
            else return;//else do nothing
        }
        )
        console.log('listener for data of type '+type+' has started');
    }
}





function joinGame() {
    document.querySelector('#start').innerText = 'Joining...';
    document.querySelector('#start').disabled = true;
    localStorage.setItem('username', username.value === ''? 'Anonymous':username.value);//store username locally
    if (sessionStorage.getItem('user-token') !== null) {//if there is a user-token already
        sendData({type: 'join-game', token: sessionStorage.getItem('user-token'), username: localStorage.getItem('username')});//wait for user token from server;
    }

    else {
        sendData({type: 'get-user-token'});//else request user token
        tokenListener = new Listener('user-token', data => {//once token is recieved, store it, then send join game request
            sessionStorage.setItem('user-token', data.token);
            sendData({type: 'join-game', token: data.token, username: localStorage.getItem('username')});
       });
       tokenListener.listen();
    }
}



addEventListener('DOMContentLoaded', () => {//script is at the top of the DOM, listeners, and pointers to HTML elements should start when all the HTML are fully loaded

    var errorListener = new Listener('error', function(data) {console.log(data.error)});
    errorListener.listen();
    
    var gameListener = new Listener('game-ready', function(data) {
        location.href = `/play/${ data.gameID }`;//redirect the URL to /play by setting the href
    });
    gameListener.listen();
    
    var statsListener = new Listener('server-stats', function(data){
        console.log('started listening for stats');
        let playerCount = document.querySelector('#players');
        let gameCount = document.querySelector('#games');
        let connectionCount = document.querySelector('#connections');
        playerCount.innerText =`Players in game: ${data.players}`;
        gameCount.innerText = `Ongoing games: ${data.games}`;
        connectionCount.innerText = `WebSocket connection: ${data.webSocketConnections}`;
        
        
    });
    statsListener.listen();

    var start = document.querySelector('#start');
    start.addEventListener('click', joinGame);
    var username = document.querySelector('#username');
    username.addEventListener('change', ()=>{localStorage.setItem('username',username.value)});//if the username changes, update changes

    sendData({ type: 'get-server-stats' });
    setInterval(() => sendData({ type: 'get-server-stats' }), 1000);//poll server stats in 0.5s interval

});
