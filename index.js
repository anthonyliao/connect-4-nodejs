var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var gamers = {}
var games = {}
var waiting = true

app.get('/', function(req, res) {
  console.log("/ requested")
  //res.send("Hello World")
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(socket) {
  console.log('user ' + socket.id + ' connected')
  socket.emit('move', Object.keys(games).length + ' games played')
  var gameId = gamers[socket.id]
  if (!gameId) {
    gameId = socket.id
    gamers[socket.id] = gameId
    console.log(gamers)
    var game = {
      "lastMover": 'bot',
      "grid": gameGrid()
    }
    console.log(game)
    games[gameId] = game
  } 
  socket.on('disconnect', function() {
    console.log('user ' + socket.id + ' disconnected')
  })
  socket.on('move', function(move) {
    console.log('user ' + socket.id + ' moved ' + move)
    console.log('game id ' + gameId)
    socket.emit('move', move)
    var game = games[gameId]
    var lastMover = game.lastMover
    console.log('last mover was ' + lastMover)
    if (lastMover == socket.id) {
      console.log(socket.id + ' can not move this turn, bot will move')
      botMove(game, socket)
    } else {
      if (!isNaN(parseInt(move))) {
        console.log('move is valid - ' + move)
        game.grid = makeMove(game.grid, move, socket.id)
	console.log(game)
	var win = checkForWin(game.grid, move, socket.id)
	if(win) {
          console.log(socket.id + ' wins!')
	  socket.emit('winner', socket.id)
        } else {
	  game.lastMover = socket.id
          botMove(game, socket)
	}
      }
    }
    socket.emit('grid', game.grid)  
  }) 
})

function botMove(game, socket) {
  console.log('bot will make random move')
  var move = Math.floor(Math.random()*7)
  socket.emit('move', 'bot moved ' + move)
  game.grid = makeMove(game.grid, move, 'bot')
  console.log(game)
  game.lastMover = 'bot'
  var win = checkForWin(game.grid, move, 'bot')
  if(win) {
    console.log('bot wins!')
    socket.emit('winner', 'bot')
  }
}

function makeMove(grid, move, player) {
  if (move < grid.length) {
    var col = grid[move]
    for (i=0; i<col.length; i++) {
      if (col[i] == '') {
        col[i] = player
        break
      }
    }
  }
  return grid
}

function checkForWin(grid, move, player) {
  var colIdx = move
  var rowIdx
  for(i=0; i<grid[colIdx].length; i++) {
    if(grid[colIdx][i] == '') {
      rowIdx = i-1
      break
    }
  }
  
  console.log('last move at ' + colIdx + ',' + rowIdx)
  
  var consecutiveCount = 0
  for(i=0; i<grid[colIdx].length; i++) {
    if(grid[colIdx][i] == player) {
      consecutiveCount++
    } else {
      consecutiveCount = 0
    }
    
    if(consecutiveCount == 4) {
      return true
    }
  }

  consecutiveCount = 0

  for(i=0; i<grid.length; i++) {
    if(grid[i][rowIdx] == player) {
      consecutiveCount++
    } else {
      consecutiveCount = 0
    }
    if(consecutiveCount == 4) {
      return true
    }
  }

  consecutiveCount = 0 

  var diag1ColIdx = colIdx
  var diag1RowIdx = rowIdx
  while(diag1ColIdx > 0 && diag1RowIdx > 0) {
    diag1ColIdx--
    diag1RowIdx--
  }
  console.log('diag1 begin cell at ' + diag1ColIdx + ',' + diag1RowIdx)
 
  var i = diag1ColIdx
  var j = diag1RowIdx
  while(i<7 && j<7) {
    if(grid[i][j] == player) {
      consecutiveCount++
    } else {
      consecutiveCount = 0
    }
     
    if(consecutiveCount == 4) {
      return true
    }
    i++
    j++
  }

  consecutiveCount = 0
  
  var diag2ColIdx = colIdx
  var diag2RowIdx = rowIdx
  while(diag2ColIdx > 0 && diag2RowIdx < 6) {
    diag2ColIdx--
    diag2RowIdx++
  }

  console.log('diag2 begin cell at ' + diag2ColIdx + ',' + diag2RowIdx)
 
  var i = diag2ColIdx
  var j = diag2RowIdx
  while(i<7 && j>=0) {
    if(grid[i][j] == player) {
      consecutiveCount++
    } else {
      consecutiveCount = 0
    }
    if(consecutiveCount == 4) {
      return true
    }
    i++
    j--
  }
  return false
}

function gameGrid() {
  var gameGrid = []
  for(i=0; i<7; i++) {
    var col = []
    for(j=0; j<7; j++) {
      col.push('')
    }
    gameGrid.push(col)
  }
  return gameGrid
}

http.listen(5000, function() {
  console.log("app started. listening on *:5000")
})

