import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Events } from '@ionic/angular';
import { HelperService } from '../helper/helper.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MainEventsService {
  headsetStates = { none: 0, ready: 1, unauthorized: 2, not_ready: 3, preparing: 5 };
  headsetConnectedState = this.headsetStates.none;
  headsetsPrepared = [];

  constructor(
    private electronService: ElectronService,
    private events: Events,
    private helperService: HelperService) {
    this.setupHeadsetEvents();
    this.setupRunningModulesEvents();
    this.events.subscribe('userUpdate', (user) => {
      this.headsetsPrepared = [];
      this.headsetConnectedState = this.headsetStates.none;
    });
  }

  sendEventAsync(eventName, options) {
    if (!environment.production) { return; }
    const log = `sendEventAsync: ${ eventName }, ${JSON.stringify(options)}`;
    this.electronService.ipcRenderer.send('send-console-log', log);
    return this.electronService.ipcRenderer.send(eventName, options);
  }

  sendEventSync(eventName, options) {
    if (!environment.production) { return; }
    const log = `sendEventAsync: ${eventName}, ${JSON.stringify(options)}`;
    this.electronService.ipcRenderer.send('send-console-log', log);

    return this.electronService.ipcRenderer.sendSync(eventName, options);
  }

  removeAllListeners(eventName) {
    return this.electronService.ipcRenderer.removeAllListeners(eventName);
  }

  listenOnMainEvents() {
    if (!this.electronService.ipcRenderer) { return; }

    const mainEvents = [
      'mode-switched', 'device-connected', 'device-disconnected', 'authorized-devices-changed',
      'offline-headset-ready', 'desktop-module-ready', 'main-error', 'unauthorized-device-connected',
      'console-log'
    ];

    mainEvents.forEach((evName) => {
      this.electronService.ipcRenderer.on(evName, (ev, options) => {
        this.events.publish(evName, options);

        const log = `Received: ${evName}, ${ JSON.stringify(options)}`;
        this.electronService.ipcRenderer.send('send-console-log', log);
      });
    });
  }

  getReadyHeadset() {
    return this.headsetsPrepared[0].id;
  }

  noHeadsetsReady() {
    return !this.headsetsPrepared.length && !(this.headsetConnectedState === this.headsetStates.preparing);
  }

  someHeadsetsReady() {
    return this.headsetsPrepared.length;
  }

  headsetIsNotReady() {
    return this.headsetConnectedState === this.headsetStates.not_ready;
  }

  headsetIsNotAuthorized() {
    return this.headsetConnectedState === this.headsetStates.unauthorized;
  }

  preparingHeadset() {
    return this.headsetConnectedState === this.headsetStates.preparing;
  }

  headsetIsReady() {
    return this.headsetConnectedState === this.headsetStates.ready;
  }

  setupHeadsetEvents() {
    this.events.subscribe('device-connected', (device) => {
      this.headsetConnectedState = this.headsetStates.preparing;
      this.preparingConnectedHeadset();
    });

    this.events.subscribe('device-disconnected', () => {
      this.headsetConnectedState = this.headsetStates.none;
      this.helperService.showToast('The device is disconnected.');
    });

    this.events.subscribe('unauthorized-device-connected', (device) => {
      this.headsetConnectedState = this.headsetStates.unauthorized;
      this.helperService.showToast('The Device you just connected is not authorized!');
    });

    this.events.subscribe('offline-headset-ready', (options) => {
      if (!options.ready) {
        if (options.headsetDevice) { this.headsetConnectedState = this.headsetStates.not_ready; }
        return this.helperService.showError(options.err);
      }

      if (!this.headsetsPrepared.some((h) => h.id === options.headsetDevice.id)) {
        this.headsetsPrepared.push(options.headsetDevice);
      }
      this.headsetConnectedState = this.headsetStates.ready;
      this.helperService.showToast('The Connected Headset is ready now, you can unplug it safely');
    });
  }

  setupRunningModulesEvents() {
    this.events.subscribe('desktop-module-ready', (options) => {
      this.helperService.removeLoading();
      if (!options.ready) {
        return this.helperService.showError(options.err);
      }

      this.helperService.showToast('The Desktop Module is ready now');
    });
  }

  preparingConnectedHeadset() {
    this.helperService.showToast('An Authorized device is connected');
    this.helperService.showLoading('We are preparing the headset..., please don\'t unplug it now');
  }

}
