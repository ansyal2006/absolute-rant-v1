const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {creativeWords} = require('./creativity.js');
var {generateMsg, generateLocationMsg} = require('./utils/messageUtils.js');
var { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/userUtils.js');

const filter = new Filter();
filter.addWords(...creativeWords);
//NOTE THAT CLIENTS ARE BROWSERS(chrome, safari, mozilla, etc) AND THEY COMMUNICATE TO-AND-FRO WITH THE WEB SERVERS(which are generally hosted on dedicated computers)
//These web servers actually store the relevant useful files which the clients see as text, image, etc when a request is made by them.
const app = express();
//loading our application in the server. This happens automatically in express(), but we need the variable 'server' for further configuration
const server = http.createServer(app);
//configuring socketio to work with a server.  Now our server supports web sockets.
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

//express.static middleware function for serving static files present in a directory.
app.use(express.static(publicDirectoryPath));
var count = 0;
//this callback executes when a new client connects. This happens only after you access the client side socketio in index.html
//sending data back to newly connected client. Note that it runs 5 times if 5 clients are connected to the server.
//when we refresh the page in the browser,basically the server receives the information from client(browser) to refresh the page,
  // which means [on('connection')] is received by the server from the client(browser) and the callback function is executed.
io.on('connection', (socket) => {
  console.log('New Websocket connection.');

  socket.on('joinActivity', ({username, room}, callback) => {

    var {error , user} = addUser({id : socket.id, username, room})
    if(error){
      return callback(error)
    }

    socket.join(user.room);
    io.to(user.room).emit('roomData', {
      room : user.room,
      users : getUsersInRoom(user.room)
    })
    socket.emit('Message', generateMsg('SMARTEST ADMIN EVER :)',`Welcome ${username}. Hope you are not that boring.`)); //socket.emit() sends the event to only the client which has made the connection to the server now.
                                        //io.emit() sends the event to every client that is connected to the server including the client that made the connection now.
    socket.broadcast.to(user.room).emit('Message', generateMsg('SMART ADMIN',`Some ${username} joined. As if this place needed any more of you people.`)); //socket.broadcast.emit() sends the event to every client except the client that has made the connection now.

    callback()
  });

  //just like socket.emit(), socket.on() can have any number of variable arguments received from socket.emit()
  //the last argument (acknowledgment) here is a function which is called after io.emit(),
  //so that the client which is connected to the server here gets notified that his message is delivered to every client after the server actually emits the client's message to every other client.
  socket.on('inputMessage',(msg, acknowledgment) => {

    var user = getUser(socket.id)
    io.to(user.room).emit('Message', generateMsg(user.username, msg));

    if(filter.isProfane(msg)){
        io.to(user.room).emit('Message', generateMsg("SMART ADMIN", 'Badi gaali dete ho be. Mirjapur se lagte ho'));
    }

    acknowledgment('Message Delivered');
  });

  socket.on('sendLocation', (location, acknowledgment) => {
    var user = getUser(socket.id)
    //the commands are synchronous -- means they will run one after another. Next statement won't execute until the present gets completely executed.
      io.to(user.room).emit('locationMessage', generateLocationMsg(user.username, `https://google.com/maps?q=${location.lat},${location.lng}`));
      //acknowledgment() will start executing only after the io.emit() statement above executes completely
      acknowledgment('Now you pray the other side isn\'t a stalker :)');
  });

  //just like [io.on('connection')] --- [socket.on('disconnect')] also is received by the server from the client(browser) on event of client disconnection and the callback function is executed.
  socket.on('disconnect', () => {
    var user = removeUser(socket.id)
    if (user) {

      io.to(user.room).emit('roomData', {
        room : user.room,
        users : getUsersInRoom(user.room)
      })
      //note that the client that connected on this socket is now disconnected, so that means we should use io.emit() and NOT socket.broadcast.emit() to notify the remaining clients connected to the server.
      io.to(user.room).emit('Message', generateMsg('SMART ADMIN', `Some ${user.username} just left. I HAVE FEELINGS TOO YOU KNOW!!!`));
    }
  });
});


//instead of app.listen , we are using server.listen now
server.listen(port, () => {
  console.log(`The server is up on port ${port}.`);
});
