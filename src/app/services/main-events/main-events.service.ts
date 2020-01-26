import { Injectable, NgZone } from '@angular/core';
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
  trackedModules = {};

  constructor(
    private electronService: ElectronService,
    private events: Events,
    private helperService: HelperService,
    private zone: NgZone
  ) {
    this.setupHeadsetEvents();
    this.setupRunningModulesEvents();
    this.trackDownloadProgress();
    this.events.subscribe('userUpdate', (user) => {
      this.headsetsPrepared = [];
      this.headsetConnectedState = this.headsetStates.none;
    });
  }

  sendEventAsync(eventName, options) {
    if (!environment.production) { return; }
    const log = `sendEventAsync: ${eventName}, ${JSON.stringify(options)}`;
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
      'console-log', 'new-module-version-available-to-download', 'new-module-version-available-to-install',
      'module-version-size', 'module-version-downloading-progress',
      'module-version-downloaded', 'module-version-installed'
    ];

    mainEvents.forEach((evName) => {
      this.electronService.ipcRenderer.on(evName, (ev, options) => {
        this.events.publish(evName, options);
        if (evName !== 'module-version-downloading-progress') {
          const log = `Received: ${evName}, ${JSON.stringify(options)}`;
          this.electronService.ipcRenderer.send('send-console-log', log);
        }
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

  getTrackedModules() {
    return this.trackedModules;
  }

  resetTrackingModules(modules) {
    this.zone.run(() => {
      this.trackedModules = {};
      this.updateTrackedModules(modules);
    });
  }

  updateTrackedModules(modules = []) {
    modules.forEach((m) => {
      if (!m.latest_version || this.trackedModules[m.id]) { return; }

      this.trackedModules[m.id] = {};
      this.sendEventAsync('module-latest-version', m.latest_version);
    });
  }

  trackDownloadProgress() {
    this.events.subscribe('module-version-size', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.size = versionData.size;
        currentModule.downloaded_size = 0;
        currentModule.ratio = 0;
        currentModule.downloading = true;
      });
    });

    this.events.subscribe('module-version-downloaded', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.ratio = 1;
        currentModule.new_version = null;
        currentModule.downloading = false;
      });
    });

    this.events.subscribe('module-version-installed', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.ratio = null;
        currentModule.new_version_not_installed = null;
      });
    });

    this.events.subscribe('module-version-downloading-progress', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.downloaded_size += versionData.data;
        currentModule.ratio = (currentModule.downloaded_size / currentModule.size);
      });
    });

    this.events.subscribe('new-module-version-available-to-download', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.new_version = versionData.name;
      });
    });

    this.events.subscribe('new-module-version-available-to-install', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.new_version_not_installed = versionData.name;
      });
    });
  }
}
