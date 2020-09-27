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
  CLIENT_EVENTS = {
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
        const address = 'http://' + host + ':' + this.port;
        const client = new Net.Socket();
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
    if (this.connectedIP) {
      this.clearFindingInterval(this.selectedSerial);
      client.end();
      return this.sendEvToWin(this.CLIENT_EVENTS.some_headsets_found, {
        connected: false, msg: `We are already connected to the selected headset ${chunk.toString()}`
      });
    }

    const serial = chunk.toString();
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
      this.sendEvToWin(this.CLIENT_EVENTS.headset_module_ready, {
        ready: true, headsetDevice: { id: serial }, ...this.awaitingVrModuleToRun
      });
      this.awaitingVrModuleToRun = null;
    }
    client.end();
  }

  onEnd(client) {
    console.log('Requested an end to the TCP connection');
  }

  setFindingInterval(selectedSerial) {
    this.connectedIP = null;

    this.findingServerInterval = setInterval(() => this.findLocalServers(selectedSerial), 5000);
    setTimeout(() => this.clearFindingInterval(selectedSerial), 30000);
    this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
      msg: `We are trying to find this headset around...: ${selectedSerial}`,
      running: true, selectedSerial
    });
  }

  clearFindingInterval(selectedSerial) {
    if (!this.findingServerInterval) { return; }

    clearInterval(this.findingServerInterval);
    this.findingServerInterval = null;
    this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
      msg: `Seems the headset is not around, we stopped the searching now: ${selectedSerial}`,
      running: false, selectedSerial
    });
  }
}

module.exports.SocketClient = SocketClient;
