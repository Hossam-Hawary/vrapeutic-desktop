// Include Nodejs' net module.
import * as  Net from 'net';
import * as  ip from 'ip';
import * as  find from 'local-devices';
import { ipcMain } from 'electron';
import { setInterval } from 'timers';

class SocketClient {
  port = 8910;
  log: any;
  sendEvToWin: any;
  selectedSerial: string;
  availableHeadsets: string[];
  awaitingVrModuleToRun;
  connectedIP;
  findingServerInterval;
  clients = {};
  CLIENT_EVENTS = {
    error: 'main-error',
    connect_headset: 'connect-headset-wirelessly',
    no_headset_selected: 'no-headset-selected',
    wrong_module_detected: 'wrong-module-detected',
    finding_selected_headset: 'finding-selected-headset',
    some_headsets_found: 'some-headsets-found',
    offline_headset_ready: 'offline-headset-ready',
    headset_module_ready: 'headset-module-ready',
    authorized_devices_changed: 'authorized-devices-changed'
  };

  constructor(opts) {
    this.log = opts.logMsg;
    this.sendEvToWin = opts.sendEvToWin;
    this.SetupEventsListeners();
  }

  SetupEventsListeners() {
    ipcMain.on(this.CLIENT_EVENTS.connect_headset, (event, options) => {
      if (options.awaitingVrModuleToRun) {
        this.awaitingVrModuleToRun = options.awaitingVrModuleToRun;
      }
      this.tryToConnect(options);
    });

    ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, (event, newHeadsets) => {
      this.availableHeadsets = newHeadsets;
    });
  }

  tryToConnect(options) {
    // if (!options.selectedSerial) {
    //   return this.sendEvToWin(this.CLIENT_EVENTS.no_headset_selected, {
    //     msg: 'Please, select one of your headsets'
    //   });
    // }
    // if (!this.availableHeadsets.includes(options.selectedSerial)) {
    //   return this.sendEvToWin(this.CLIENT_EVENTS.wrong_headset_selected, {
    //     msg: `We cannot find this headset in your authorized headsets: ${options.selectedSerial}`,
    //     selectedSerial: options.selectedSerial
    //   });
    // }
    this.setFindingInterval(options.selectedSerial);
  }

  async findLocalServers(selectedSerial) {
    try {
      this.selectedSerial = selectedSerial;

      const devices = await find();
      console.log('findLocalServers...', this.selectedSerial, devices);
      /*
      [
        { name: '?', ip: '192.168.0.10', mac: '...' },
      ]
      */
      devices.forEach((device) => {
        const host = device.ip;
        const client = new Net.Socket();
        this.clients[host] = client;
        // Create a new TCP client.
        client.connect({ port: this.port, host }, () => { this.onConnect(client); });
        client.on('data', (chunk) => { this.onDataReceived(chunk, client); });
        client.on('end', () => { this.onEnd(client); });
        client.on('error', (err) => { this.onError(err, client); });
      });
    } catch (err) {
      console.log('findLocalServers. error..', this.selectedSerial, err);
    }
  }

  onEnd(client) {
    console.log('Requested an end to the TCP connection');
  }

  setFindingInterval(selectedSerial) {
    this.connectedIP = null;
    this.findLocalServers(selectedSerial);
    this.findingServerInterval = setInterval(() => this.findLocalServers(selectedSerial), 5000);
    setTimeout(() => this.clearFindingInterval(selectedSerial), 15000);
    this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
      msg: `We are trying to find this headset around...: ${selectedSerial}`,
      running: true, selectedSerial
    });
  }

  onConnect(client) {
    console.log('TCP connection established with the server...');
    client.write('serial');
  }

  onError(err, client) {
    console.log('connect error...', err.stack);
    client.end();
  }

  onDataReceived(chunk, client) {
    console.log(`Data received from the server: ${chunk.toString()}.`);

    const data = chunk.toString().split(' ');
    if (data[0] === 'serial') {
      const serial = data[1];
      if (serial === this.selectedSerial) {
        client.write('moduleName');
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
          msg: `selected headset is available around you, and we are verifying the module '${this.awaitingVrModuleToRun.moduleName}'...`,
          running: true, serial
        });
      }
    } else if (data[0] === 'moduleName') {
      const moduleName = data[1];
      if (moduleName === this.awaitingVrModuleToRun.packageName) {
        client.write('connect ' + ip.address());
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
          msg: `The module '${this.awaitingVrModuleToRun.moduleName}' is verified now on the headset and the IP has sent to it.`,
          running: true, serial: this.selectedSerial
        });
      } else {
        this.sendEvToWin(this.CLIENT_EVENTS.wrong_module_detected, {
          connected: false, selectedSerial: this.selectedSerial,
          msg: `
            We detected that the running module on the selected headset is '${moduleName}' not '${this.awaitingVrModuleToRun.moduleName}'
          `
        });
      }
    } else if (data[0] === 'gotServerUrl') {
      this.headsetIsConnectedSuccessfully(client);
    }
  }

  clearFindingInterval(selectedSerial) {
    if (!this.findingServerInterval) { return; }

    clearInterval(this.findingServerInterval);
    this.findingServerInterval = null;
    this.endAllClientsConnections();
    this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
      msg: `Seems the headset is not around, we stopped the searching now: ${selectedSerial}`,
      running: false, selectedSerial
    });
  }

  headsetIsConnectedSuccessfully(client) {
    this.connectedIP = client;
    this.clearFindingInterval(this.selectedSerial);
    this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: this.selectedSerial } });
    if (this.awaitingVrModuleToRun) {
      this.sendEvToWin(this.CLIENT_EVENTS.headset_module_ready, {
        ready: true, headsetDevice: { id: this.selectedSerial }, ...this.awaitingVrModuleToRun
      });
      this.awaitingVrModuleToRun = null;
    }
  }

  endAllClientsConnections() {
    Object.values(this.clients).forEach((client: any) => client.end());
    this.clients = {};
  }
}

module.exports.SocketClient = SocketClient;
