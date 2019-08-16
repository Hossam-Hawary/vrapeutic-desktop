var shortid = require('shortid');
var express = require('express');
var app = express();
var Enum = require('enum');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {
    serveClient: false,
    // below are engine.IO options
    cookie: false
});
var PORT = 3000;
server.listen(PORT, '0.0.0.0');
console.log('Server started on port ' + PORT);
var clients = [];
var maxDesktopConnections = 1;
var maxHeadsetConnections = 1;
var ClientType = new Enum({ Desktop: 'Desktop',
    Headset: 'Headset' });
io.on('connection', function (socket) {
    var clientId = shortid.generate();
    var client = {
        id: clientId,
        clientType: null,
        rejected: false
    };
    console.log('client connected');
    // console.log('client ID', clientId);
    console.log('-----------------------');
    clients[clientId] = client;
    socket.emit('register', { id: clientId });
    console.log('registering client...');
    socket.emit('requestClientType');
    console.log('requesting client type...');
    console.log('-----------------------');
    socket.on('updateClientType', function (clientData) {
        console.log('updating client type...');
        console.log('remaining desktop connections is', maxDesktopConnections);
        console.log('remaining headset connections is', maxHeadsetConnections);
        client.clientType = clientData.clientType;
        if (client.clientType == ClientType.Desktop) {
            if (maxDesktopConnections > 0) {
                maxDesktopConnections--;
                console.log('client accepted!');
            }
            else {
                socket.emit('connectionRejected');
                console.log('rejecting connection...');
                client.rejected = true;
            }
        }
        if (client.clientType == ClientType.Headset) {
            if (maxHeadsetConnections > 0) {
                maxHeadsetConnections--;
                console.log('client accepted!');
            }
            else {
                socket.emit('connectionRejected');
                console.log('rejecting connection...');
                client.rejected = true;
            }
        }
        console.log('remaining desktop connections is', maxDesktopConnections);
        console.log('remaining headset connections is', maxHeadsetConnections);
        if (maxDesktopConnections == 0 && maxHeadsetConnections == 0) {
            io.sockets.emit('roomReady');
            console.log('setting up room');
        }
        console.log('-----------------------');
    });
    socket.on('changeControllerRotation', function (data) {
        socket.broadcast.emit('updateControllerRotation' + data.controllerName, data);
    });
    socket.on('changeControllerPosition', function (data) {
        socket.broadcast.emit('updateControllerPosition' + data.controllerName, data);
    });
    socket.on('fireFunction', function (data) {
        io.sockets.emit(data.functionName, data);
        console.log(data.functionName + ' fired!');
    });
    socket.on('disconnect', function () {
        socket.broadcast.emit('clientDisconnected');
        console.log('disconnecting client...');
        console.log('-----------------------');
        if (client.clientType == ClientType.Desktop) {
            if (client.rejected == false) {
                maxDesktopConnections++;
            }
        }
        else if (client.clientType == ClientType.Headset) {
            if (client.rejected == false) {
                maxHeadsetConnections++;
            }
        }
        console.log('maxDesktopConnections', maxDesktopConnections);
        console.log('maxHeadsetConnections', maxHeadsetConnections);
        console.log('-----------------------');
        delete clients[clientId];
        console.log('clients left:');
        console.log(clients);
        console.log('-----------------------');
    });
});
//# sourceMappingURL=server.js.map