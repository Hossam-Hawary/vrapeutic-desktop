
const shortid = require('shortid');
const express = require('express');
const app = express();
const Enum = require('enum');

const server = require('http').createServer(app);
const io = require('socket.io').listen(server, {
    serveClient: false,
    // below are engine.IO options
    cookie: false
});
const PORT = 3000;

server.listen(PORT, '0.0.0.0');

console.log('Server started on port ' + PORT);

let clients = [];
let maxDesktopConnections = 1;
let maxHeadsetConnections = 1;
let ClientType = {
    Desktop: 'Desktop',
    Headset: 'Headset'
};

io.on('connection', (socket) => {
    const clientId = shortid.generate();
    const client = {
        clientType: null,
        rejected: true,
        moduleName: null
    };

    /* -----logging region----- */
    console.log('client connected');
    console.log('-----------------------');
    /* -----logging region----- */

    clients[clientId] = client;

    /* -----logging region----- */
    console.log('registering client...');
    /* -----logging region----- */

    socket.emit('register', { id: clientId });

    /* -----logging region----- */
    console.log('requesting module name...');
    /* -----logging region----- */

    socket.emit('requestModuleName');

    /* -----logging region----- */
    console.log('requesting client type...');
    /* -----logging region----- */

    socket.emit('requestClientType');

    socket.on('updateClientType', (clientData) => {

        /* -----logging region----- */
        console.log('updating client type...');
        console.log(`remaining desktop connections is: ${maxDesktopConnections}`);
        console.log(`remaining headset connections is: ${maxHeadsetConnections}`);
        /* -----logging region----- */

        client.clientType = clientData.clientType;

        if (client.clientType !== ClientType.Desktop && client.clientType !== ClientType.Headset) {
            /* -----logging region----- */
            console.log('client is being rejected!...', client.clientType);
            /* -----logging region----- */

            client.rejected = true;
            socket.disconnect();
            return;
        }

        if (client.clientType === ClientType.Desktop) {
            if (maxDesktopConnections > 0) {
                /* -----logging region----- */
                console.log('client Desktop accepted!');
                /* -----logging region----- */
                client.rejected = false;
                maxDesktopConnections--;
            } else {
                /* -----logging region----- */
                console.log('rejecting Desktop connection...', maxDesktopConnections);
                /* -----logging region----- */

                socket.emit('connectionRejected');
                client.rejected = true;
                // socket.disconnect();
                // return;
            }
        }

        if (client.clientType === ClientType.Headset) {
            if (maxHeadsetConnections > 0) {
                /* -----logging region----- */
                console.log('client Headset accepted!');
                /* -----logging region----- */
                client.rejected = false;

                maxHeadsetConnections--;
            } else {
                /* -----logging region----- */
                console.log(`rejecting Headset connection...${maxHeadsetConnections}`);
                /* -----logging region----- */

                socket.emit('connectionRejected');
                client.rejected = true;
                // socket.disconnect();
                // return;
            }
        }

        /* -----logging region----- */
        console.log(`remaining desktop connections is: ${maxDesktopConnections}`);
        console.log(`remaining headset connections is: ${maxHeadsetConnections}`);
        /* -----logging region----- */

        if (maxDesktopConnections === 0 && maxHeadsetConnections === 0) {

            const moduleName = client.moduleName;
            let roomReady = true;
            for (const [_, value] of Object.entries(clients.filter((c) => !c.rejected))) {
                roomReady = roomReady && (value.moduleName === moduleName);
            }

            /* -----logging region----- */
            console.log('setting up room');
            /* -----logging region----- */

            if (roomReady) {
                console.log('devices are on same module');
                io.sockets.emit('roomReady');
            } else {
                console.log('devices are on different modules');
            }
        }

        /* -----logging region----- */
        console.log(clients);
        console.log('-----------------------');
        /* -----logging region----- */
    });

    socket.on('updateModuleName', (clientData) => {
        /* -----logging region----- */
        console.log('updating module name...', clientData.moduleName);
        /* -----logging region----- */
        client.moduleName = clientData.moduleName;
    });

    socket.on('changeControllerRotation', (data) => {
        socket.broadcast.emit('updateControllerRotation' + data.controllerName, data);
    });

    socket.on('changeControllerPosition', (data) => {
        socket.broadcast.emit('updateControllerPosition' + data.controllerName, data);
    });

    socket.on('fireFunction', (data) => {
        io.sockets.emit(data.functionName, data);
        console.log(data.functionName + ' fired!');
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('clientDisconnected');
        console.log('disconnecting client...', clientId);
        console.log('-----------------------');

        if (client.clientType === ClientType.Desktop) {
            if (client.rejected === false) {
                maxDesktopConnections++;
            }
        } else if (client.clientType === ClientType.Headset) {
            if (client.rejected === false) {
                maxHeadsetConnections++;
            }
        }

        console.log(`remaining desktop connections is: ${maxDesktopConnections}`);
        console.log(`remaining headset connections is: ${maxHeadsetConnections}`);
        console.log('-----------------------');

        delete clients[clientId];

        console.log('clients left:', clientId);
        console.log(clients);
        console.log('-----------------------');
    });
});
