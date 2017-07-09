/**
 * Created by chuanghuang on 7/5/17.
 */
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {}
var nameUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    //Start the Socket.io server, allowing it to piggyback on the existing HTTP server
    io = socketio.listen(server);

    io.set('log level', 1);
    //Define how each user connection will be handled
    io.sockets.on('connection', function (socket) {

        //Assign user a guest name when they connect
        guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);

        //Place user in the "Lobby" room when they connect
        joinRoom(socket, 'Lobby');

        //Handle user messages, name change attempts, and room creation/changes.
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, nameUsed);
        handleRoomJoining(socket);

        // Provide user with a list of occupied rooms on request.
        socket.on('rooms', function () {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        //    Define "cleanup" logic for when a user disconnects
        handleClientDisconnecttion(socket, nickNames, nameUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    //Generate new guest name
    var name = 'Guest' + guestNumber;
    //Associate guest name with client connection ID
    nickNames[socket.id] = name;
    //Let user know their guest name
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    //Note that guest name is now used
    namesUsed.push(name);
    //Increment counter used to generate guest names
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    //Make user join room
    socket.join(room);
    //Note that user is now in this room
    currentRoom[socket.id] = room;
    //Let user know they're now in a new room
    socket.emit('joinResult', {room : room});
    //Let other users in room know that a user has joined
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });
    //Determine what other users are in the same room as the user
    var usersInRoom = io.socket.client(room);
    //If other users exist, summarize who they are
    if(usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        //Send the summary of other users in the room to the user
        socket.emit('message', {text: usersInRoomSummary});
    }
}