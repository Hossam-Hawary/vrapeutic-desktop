"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Include Nodejs' net module.
var Net = require("net");
var ip = require("ip");
var find = require("local-devices");
var electron_1 = require("electron");
var timers_1 = require("timers");
var SocketClient = /** @class */ (function () {
    function SocketClient(opts) {
        this.port = 8910;
        this.CLIENT_EVENTS = {
            error: 'main-error',
            connect_headset: 'connect-headset-wirelessly',
            no_headset_selected: 'no-headset-selected',
            wrong_headset_selected: 'wrong-headset-selected',
            finding_selected_headset: 'finding-selected-headset',
            some_headsets_found: 'some-headsets-found',
            offline_headset_ready: 'offline-headset-ready',
            headset_module_ready: 'headset-module-ready',
            authorized_devices_changed: 'authorized-devices-changed'
        };
        this.log = opts.logMsg;
        this.sendEvToWin = opts.sendEvToWin;
        this.SetupEventsListeners();
    }
    SocketClient.prototype.SetupEventsListeners = function () {
        var _this = this;
        electron_1.ipcMain.on(this.CLIENT_EVENTS.connect_headset, function (event, options) {
            if (options.awaitingVrModuleToRun) {
                _this.awaitingVrModuleToRun = options.awaitingVrModuleToRun;
            }
            _this.tryToConnect(options);
        });
        electron_1.ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, function (event, newHeadsets) {
            _this.availableHeadsets = newHeadsets;
        });
    };
    SocketClient.prototype.tryToConnect = function (options) {
        if (!options.selectedSerial) {
            return this.sendEvToWin(this.CLIENT_EVENTS.no_headset_selected, {
                msg: 'Please, select one of your headsets'
            });
        }
        // if (!this.availableHeadsets.includes(options.selectedSerial)) {
        //   return this.sendEvToWin(this.CLIENT_EVENTS.wrong_headset_selected, {
        //     msg: `We cannot find this headset in your authorized headsets: ${options.selectedSerial}`,
        //     selectedSerial: options.selectedSerial
        //   });
        // }
        this.setFindingInterval(options.selectedSerial);
    };
    SocketClient.prototype.findLocalServers = function (selectedSerial) {
        return __awaiter(this, void 0, void 0, function () {
            var devices, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.selectedSerial = selectedSerial;
                        return [4 /*yield*/, find()];
                    case 1:
                        devices = _a.sent();
                        console.log('findLocalServers...', this.selectedSerial, devices);
                        /*
                        [
                          { name: '?', ip: '192.168.0.10', mac: '...' },
                        ]
                        */
                        devices.forEach(function (device) {
                            var host = device.ip;
                            var address = 'http://' + host + ':' + _this.port;
                            var client = new Net.Socket();
                            // Create a new TCP client.
                            client.connect({ port: _this.port, host: host }, function () { _this.onConnect(client); });
                            client.on('data', function (chunk) { _this.onDataReceived(chunk, client); });
                            client.on('end', function () { _this.onEnd(client); });
                            client.on('error', function (err) { _this.onError(err, client); });
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.log('findLocalServers. error..', this.selectedSerial, err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SocketClient.prototype.onConnect = function (client) {
        console.log('TCP connection established with the server...');
        client.write('serial');
    };
    SocketClient.prototype.onError = function (err, client) {
        console.log('connect error...', err.stack);
        client.end();
    };
    SocketClient.prototype.onDataReceived = function (chunk, client) {
        console.log("Data received from the server: " + chunk.toString() + ".");
        if (this.connectedIP) {
            this.clearFindingInterval(this.selectedSerial);
            client.end();
            return this.sendEvToWin(this.CLIENT_EVENTS.some_headsets_found, {
                connected: false,
                msg: "We are already connected to the selected headset " + chunk.toString()
            });
        }
        var serial = chunk.toString();
        this.sendEvToWin(this.CLIENT_EVENTS.some_headsets_found, {
            connected: false, msg: 'Some headset is available around you...', selectedSerial: serial
        });
        console.log('SERIAL is: ' + serial);
        if (serial === this.selectedSerial) {
            client.write('connect ' + ip.address());
            this.connectedIP = client;
            console.log('connectedIP...', client);
            this.clearFindingInterval(this.selectedSerial);
            this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: serial } });
        }
        if (this.awaitingVrModuleToRun) {
            this.sendEvToWin(this.CLIENT_EVENTS.headset_module_ready, __assign({ ready: true, headsetDevice: { id: serial } }, this.awaitingVrModuleToRun));
            this.awaitingVrModuleToRun = null;
        }
        client.end();
    };
    SocketClient.prototype.onEnd = function (client) {
        console.log('Requested an end to the TCP connection');
    };
    SocketClient.prototype.setFindingInterval = function (selectedSerial) {
        var _this = this;
        this.connectedIP = null;
        this.findingServerInterval = timers_1.setInterval(function () { return _this.findLocalServers(selectedSerial); }, 5000);
        setTimeout(function () { return _this.clearFindingInterval(selectedSerial); }, 30000);
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
            msg: "We are trying to find this headset around...: " + selectedSerial,
            running: true,
            selectedSerial: selectedSerial
        });
    };
    SocketClient.prototype.clearFindingInterval = function (selectedSerial) {
        if (!this.findingServerInterval) {
            return;
        }
        clearInterval(this.findingServerInterval);
        this.findingServerInterval = null;
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
            msg: "We Stopped the finding interval now: " + selectedSerial,
            running: false,
            selectedSerial: selectedSerial
        });
    };
    return SocketClient;
}());
module.exports.SocketClient = SocketClient;
//# sourceMappingURL=socket_client.js.map