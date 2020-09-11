"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Include Nodejs' net module.
var Net = require("net");
var ip = require("ip");
var find = require("local-devices");
var electron_1 = require("electron");
var SocketClient = /** @class */ (function () {
    function SocketClient(opts) {
        this.port = 8910;
        this.CLIENT_EVENTS = {
            error: 'main-error',
            connect_headset: 'connect-headset-wirelessly',
            no_headset_selected: 'no-headset-selected',
            wrong_headset_selected: 'wrong-headset-selected',
            finding_to_headset: 'finding-to-headset',
            some_headsets_found: 'some-headsets-found',
            offline_headset_ready: 'offline-headset-ready',
            authorized_devices_changed: 'authorized-devices-changed'
        };
        this.log = opts.logMsg;
        this.sendEvToWin = opts.sendEvToWin;
        this.SetupEventsListeners();
    }
    SocketClient.prototype.SetupEventsListeners = function () {
        var _this = this;
        electron_1.ipcMain.on(this.CLIENT_EVENTS.connect_headset, function (event, options) {
            if (!options.selectedSerial) {
                return _this.sendEvToWin(_this.CLIENT_EVENTS.no_headset_selected, {
                    msg: 'Please, select one of your headsets'
                });
            }
            // if (!this.availableHeadsets.includes(options.selectedSerial)) {
            //   return this.sendEvToWin(this.CLIENT_EVENTS.wrong_headset_selected, {
            //     msg: `We cannot find this headset in your authorized headsets: ${options.selectedSerial}`,
            //     selectedSerial: options.selectedSerial
            //   });
            // }
            _this.findLocalServers(options.selectedSerial);
            _this.sendEvToWin(_this.CLIENT_EVENTS.finding_to_headset, {
                msg: "We are trying to find this headset around...: " + options.selectedSerial,
                selectedSerial: options.selectedSerial
            });
        });
        electron_1.ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, function (event, newHeadsets) {
            _this.availableHeadsets = newHeadsets;
        });
    };
    SocketClient.prototype.findLocalServers = function (selectedSerial) {
        var _this = this;
        this.selectedSerial = selectedSerial;
        find().then(function (devices) {
            /*
                  { name: '?', ip: '192.168.0.10', mac: '...' },
                  { name: '...', ip: '192.168.0.17', mac: '...' },
                  { name: '...', ip: '192.168.0.21', mac: '...' },
                  { name: '...', ip: '192.168.0.22', mac: '...' }
              ]
            */
            console.log(devices);
            var _loop_1 = function (i) {
                var host = devices[i].ip;
                var address = 'http://' + host + ':' + _this.port;
                console.log(address);
                var client = new Net.Socket();
                // Create a new TCP client.
                client.connect({ port: _this.port, host: host }, function () { _this.onConnect(client); });
                client.on('data', function (chunk) { _this.onDataReceived(chunk, client); });
                client.on('end', function () { _this.onEnd(client); });
                client.on('error', function (err) { _this.onError(err, client); });
            };
            for (var i = 0; i < devices.length + 1; i++) {
                _loop_1(i);
            }
        });
    };
    SocketClient.prototype.onConnect = function (client) {
        console.log('TCP connection established with the server.');
        client.write('serial');
    };
    SocketClient.prototype.onError = function (err, client) {
        console.log(err);
        client.end();
    };
    SocketClient.prototype.onDataReceived = function (chunk, client) {
        console.log("Data received from the server: " + chunk.toString() + ".");
        var serial = chunk.toString();
        this.sendEvToWin(this.CLIENT_EVENTS.some_headsets_found, {
            connected: false, msg: 'Some headset is available around you...', selectedSerial: serial
        });
        console.log('SERIAL is: ' + serial);
        if (serial === this.selectedSerial) {
            client.write('connect ' + ip.address());
            this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: serial } });
        }
        client.end();
    };
    SocketClient.prototype.onEnd = function (client) {
        console.log('Requested an end to the TCP connection');
    };
    return SocketClient;
}());
module.exports.SocketClient = SocketClient;
//# sourceMappingURL=socket_client.js.map