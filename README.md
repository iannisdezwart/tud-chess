# TUDChess

Authors: Iannis de Zwart, Eugene Wu.
This repository contains the source code of our TU Delft styled chess game.

It is a full featured chess game which complies with the FIDE chess rules.
Players can pair up with opponents and play against each other.
Players play on a board with a standard chess set-up, using the mouse to
control the pieces.

After a game is over, players can analyse their own game, going back in time.
Games are saved in a simple database, so they can be analysed at any time.


## Installation and running

```sh
cd back-end
npm install
npm start
```

Starts the server at port 3000.

## Files

### Back-end

#### index.js

The file sets up the WebSocket server. The server can take requests to:

* Get user token (used by the server to identify the players)
* Join game
* Play game
* Move a piece
* Spectate game (people with the URL to the game can spectate)
* Resign
* Offer draw
* Get server statistics

The message between clients and server can be parsed into a JSON object. This data object has the attribute *type* which specifies which one of the requests above is made.

All received are logged on the console 

#### util.js

This file contains 3 functions (all of which are exported) commonly used in other modules.

##### send

The parameters for *send* are *ws* and *data*. *ws* is a WebSocket object and *data* is a data (JSON) object (as defined by our game). *send* encodes *data* as string and sends it through *ws*.

All data sent by *send* are logged on the console

##### sendError

The parameters for *send* are *ws* and *error*. *ws* is a WebSocket object and *error* is a string. *sendError* constructs a JSON object containing the error and sends it through *ws* using *send*.

##### randomID

The parameters for *randomID* is *length*. It generates a random string whose length is *length*.

#### get-user-token.js

*get-user-token.js* is a module that only contains the function *getUserToken* (which is exported). This function takes a WebSocket object *ws* as parameter and sends a JSON object *data* where *data.type* is 'user-token' and *data.token* is a random 64 characters string

#### join-game.js

This module exports the function *joinGame*. The function takes 2 parameters, *data*, which is the JSON object sent from the client, and *ws*, which is the client's websocket.

When the function is called and there is no player who is already waiting to play, the new player's client socket, username, and token are stored in the global variable *waitingPlayer*.

When the function is called and there is already someone waiting, a new game will be created using a new game ID and 2 player objects (created using client data). The new game is then recorded in the map *games*, and the game ID is set to both players.

#### play-game.js

It is expected that once the server responded to the client's request to join game, the client will send back a request to start the game via sending an object with attribute *type* set to *'play-game'* along with the game ID and user token (as confirmation). This request will be handled by the play-game module, which exports the function *playGame*. This function takes 2 parameters, *data* (object sent from the client) and *ws* (client websocket). *data* should contain attribute *gameID*, which is used to fetch the game object from *games* (a map containing all the games created), then *playGame* checks if the client's user token is correct, and if so, the game object records the client web socket so the server can send updates about the game's state (this is done by calling the function *sendGameState* from *Game.js*).

#### move.js

The client can request to make a piece by sending an object to the server whose attributes include of a game ID, a user token, squares which the piece moves from and to, and in some cases the type which the pawn is promoted to.

This module handles this with the function *move*. *move* takes the object sent from the client and the client web socket as parameters. It first uses the game ID and user token checks whether the client is allowed to make a move (if not, then an error will be sent back). It then checks if the move is legal, and finally updates the clock and send the updated board back to the players using *sendMove* (from *Game.js*).

When *sendMove* is called, the promotion type is set to queen if the client did not specify otherwise. However the promotion will not be carried out unless a pawn is being moved to the end of the board.

#### spectate-game.js

The module exports the function *spectateGame*. It takes a client data object and a client web socket as parameters. When called, it checks whether the game ID contained in the client data object is valid, if so, then the client is added to the list of web sockets which the server sends board updates to.

#### resign.js

The module exports the function *resign*. It takes a client data object and a client web socket as parameters. When called, it checks if the request is made by a valid user token for a valid game, if so, then the game calls *endGame* (from *Game.js*).

#### offer-draw.js

The module exports the function *offerDraw*. It takes a client data object and a client web socket as parameters. When called, it checks if the request is made by a valid user token for a valid game, if so, then the game calls *offerDraw* (from *Game.js*).

#### server-stats.js

The module exports the function *serverStats*. It takes a client web socket as parameter. It sends the web socket the number of active games, then number of players in game, and the number of web socket connections to the server.

#### Game.js

This module exports the variable *games* and the class *Game*.

##### games

*games* is a map that maps game ID of ongoing games to the Game object

##### Game

###### Constructor

A new game is constructed with a game ID and 2 player objects. The game ID is a string and the player objects are expected to have attributes *ws*, which is a client web socket, *token*, which is the user token, *username*, and *clock*, which is the amount of time the player has.

The colour of the player is randomly selected.

###### Fields

A Game object has the following fields:

* *id*: the game id
* *white*: the white player
* *black* the black player
* *whiteOffersDraw*: a boolean variable that is only true after white requested draw
* *blackOffersDraw*: a boolean variable that is only true after black requested draw
* *subscribers*: a set is used to hold all the client web sockets that need to receive updates of the game
* *board*: a ChessBoard object (from *ChessBoard.js*)
* *lastMoveTime*: stores the time (according to server clock) which the latest move was made
* *history*: a map which maps the board state, hashed as a string, to the number of times this board state has occurred.
* *fiftyMoveRule*: a counter for the number of moves made
* *ended*: a boolean variable that is true only when the game is over

###### Methods

A Game object has the following methods:

* *addHistory()*: hashes the string representation of the board state (generated by the *boardStateString* method from *ChessBoard*) using SHA-2 and adds to the board state's occurrence in *history*
* *handleTimeoutLoss()*: Check if any side has ran out of time. If not, then make a recursive call to itself after a timeout using the minimum time on the clocks (as that is the earliest possible time for the game to end via timeout).
* *endGame(winner, reason)*: send all web socket in *subscribers* a message about the winner of the game and why the game ended
*  *calculateClocks()*: substract the time passed from the side that made the move (assuming 2 turns has passed). The time passed is the difference between the current time and *lastMoveTime*. This method returns an object containing the time on the white & black clocks
* *sendGameState(ws)*: sends the state of the game to the client web socket. This includes:
  * String encoding of the board
  * The side that need to make a move
  * The players' usernames
  * The time on the players' clocks
  * The side (if any) who made a draw offer
* *sendMove(from, to, promotion)*: this method does several things
  * resets the draw offer (since the players did not immediate agree)
  * check the 50 move rule (by checking if the umber of pieces on the board has changed after the move, and if a pawn has moved)
  * update the clock of the side that made the move
  * send the move to all the web socket in *subscribers*
  * add the board state to *history*
  * check if the move leads to a threefold repetition using *history*
  * check if the move leads to a checkmate
* *offerDraw(player)*: if white offers draw, then *whiteOffersDraw* is set to true; if black offers draw, then *blackOffersDraw* is set to true. If both variables are true, then the game ends
* *destroy()*: delete the game from *games*

### routes.js, spectate.js, and play.js

These 3 modules combine to redirect players to the appropriate page. If the URL path is */play/gameID* or */spectate/gameID*, where *gameID* is a valid game ID, then the client is served with the game screen. Otherwise the client is served redirected to the splash screen
