// Include Nodejs' net module.
import * as  Net from 'net';
import * as  ip from 'ip';
import * as  find from 'local-devices';
import { ipcMain } from 'electron';

class SocketClient {
  port = 8910;
  client = new Net.Socket();
  log: any;
  sendEvToWin: any;
  selectedSerial: string;
  availableHeadsets: string[];

  CLIENT_EVENTS = {
    error: 'main-error',
    connect_headset: 'connect-headset-wirelessly',
    no_headset_selected: 'no-headset-selected',
    wrong_headset_selected: 'wrong-headset-selected',
    finding_to_headset: 'finding-to-headset',
    some_headsets_found: 'some-headsets-found',
    offline_headset_ready: 'offline-headset-ready',
    authorized_devices_changed: 'authorized-devices-changed'
  };

  constructor(opts) {
    this.log = opts.logMsg;
    this.sendEvToWin = opts.sendEvToWin;
    this.SetupEventsListeners();
  }

  SetupEventsListeners() {
    ipcMain.on(this.CLIENT_EVENTS.connect_headset, (event, options) => {
      if (!options.selectedSerial) {
        return this.sendEvToWin(this.CLIENT_EVENTS.no_headset_selected, {
          msg: 'Please, select one of your headsets'
        });
      }
      if (!this.availableHeadsets.includes(options.selectedSerial)) {
        return this.sendEvToWin(this.CLIENT_EVENTS.wrong_headset_selected, {
          msg: `We cannot find this headset in your authorized headsets: ${options.selectedSerial}`,
          selectedSerial: options.selectedSerial
        });
      }
      this.findLocalServers(options.selectedSerial);
      this.sendEvToWin(this.CLIENT_EVENTS.finding_to_headset, {
        msg: `We are trying to find this headset around...: ${options.selectedSerial}`,
        selectedSerial: options.selectedSerial
      });

    });

    ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, (event, newHeadsets) => {
      this.availableHeadsets = newHeadsets;
    });
  }

  findLocalServers(selectedSerial) {
    this.selectedSerial = selectedSerial;
    find().then(devices => {
      /*
            { name: '?', ip: '192.168.0.10', mac: '...' },
            { name: '...', ip: '192.168.0.17', mac: '...' },
            { name: '...', ip: '192.168.0.21', mac: '...' },
            { name: '...', ip: '192.168.0.22', mac: '...' }
        ]
      */
      console.log(devices);
      for (let i = 0; i < devices.length + 1; i++) {
        const host = devices[i].ip;
        const address = 'http://' + host + ':' + this.port;
        console.log(address);
        // Create a new TCP client.
        this.client.connect({ port: this.port, host }, this.onConnect);
        this.client.on('data', this.onDataReceived);
        this.client.on('end', this.onEnd);
        this.client.on('error', this.onError);
      }
    });
  }

  onConnect() {
    console.log('TCP connection established with the server.');
    this.client.write('serial');
  }

  onError(err) {
    console.log(err);
    this.client.end();
  }

  onDataReceived(chunk) {
    console.log(`Data received from the server: ${chunk.toString()}.`);
    const serial = chunk.toString();

    this.sendEvToWin(this.CLIENT_EVENTS.some_headsets_found, {
      connected: false, msg: 'Some headset is available around you...', selectedSerial: serial
    });

    console.log('SERIAL is: ' + serial);
    if (serial === this.selectedSerial) {
      this.client.write('connect ' + ip.address());
      this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: serial }} );
    }
    this.client.end();
  }

  onEnd() {
    console.log('Requested an end to the TCP connection');
  }
}
module.exports.SocketClient = SocketClient;
