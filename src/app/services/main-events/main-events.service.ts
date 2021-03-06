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
  wirelessMode;
  wirelessHeadsetSelected;
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
      'module-version-downloaded', 'module-version-installed', 'module-version-install-error',
      'module-version-download-error', 'install-android-module-ready', 'installing-android-module',
      'some-headsets-found', 'finding-selected-headset', 'wrong-module-detected', 'no-headset-selected', 'headset-module-ready'
    ];

    mainEvents.forEach((evName) => {
      this.electronService.ipcRenderer.on(evName, (ev, options) => {
        this.events.publish(evName, options);
        if (evName !== 'module-version-downloading-progress') {
          console.log(evName, options);
          const log = `Received: ${evName}, ${JSON.stringify(options)}`;
          this.electronService.ipcRenderer.send('send-console-log', log);
        }
      });
    });
  }

  getReadyHeadset() {
    return this.headsetsPrepared[0];
  }

  noHeadsetsReady() {
    return (!this.wirelessMode || !this.wirelessHeadsetSelected) &&
      (!this.headsetsPrepared.length && !(this.headsetConnectedState === this.headsetStates.preparing));
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

  preparingConnectedHeadset() {
    this.helperService.showToast('An Authorized device is connected');
    this.helperService.showLoading('We are preparing the headset..., please don\'t unplug it now');
  }

  setupHeadsetEvents() {
    this.events.subscribe('installing-android-module', (options) => {
      this.helperService.showLoading(options.msg);
    });

    this.events.subscribe('install-android-module-ready', (options) => {
      if (!options.ready) {
        return this.helperService.showError(options.err);
      }

      this.helperService.showToast(options.msg);
    });

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

    this.events.subscribe('finding-selected-headset', (options) => {
      if (!options.running) { this.helperService.showToast(options.msg); }
    });

    this.events.subscribe('wrong-module-detected', (options) => {
      this.helperService.showError(options.msg);
    });
  }

  reconnectHeadsetWirelesslyToRunModule(moduleName, moduleId, packageName) {
    this.sendEventAsync('connect-headset-wirelessly',
      {
        selectedSerial: this.wirelessHeadsetSelected,
        awaitingVrModuleToRun: { moduleId, moduleName, packageName }
      }
    );
  }

  setupRunningModulesEvents() {
    this.events.subscribe('desktop-module-ready', (options) => {
      if (!options.ready) {
        return this.helperService.showError(options.err);
      }

      this.helperService.showToast('The Desktop Module is ready now');
    });

    this.events.subscribe('headset-module-ready', (options) => {
      if (!options.ready) {
        return this.helperService.showError(options.msg);
      }

      this.helperService.showToast('The VR Module is ready now on the headset');
      this.runModuleAfterHeadsetConnected(options.moduleName, options.moduleId);
    });
  }

  runModuleAfterHeadsetConnected(moduleName, moduleId) {
    this.sendEventAsync('run-module', {
      moduleName, moduleId
    }
    );
  }

  getTrackedModules() {
    return this.trackedModules;
  }

  installAndroidModule(module) {
    const headset = this.getReadyHeadset();
    if (!headset) { return; }

    this.sendEventAsync('install-android-module-to-headset', { module, headset});
  }

  resetOneTrackingModule(module) {
    const currenModule = this.trackedModules[module.id];
    if (currenModule.downloading || currenModule.installing) { return; }

    this.sendEventAsync('reset-installed-module', module.id);
    this.trackedModules[module.id] = null;
    this.zone.run(() => {
      this.updateOneTrackedModule(module);
    });
  }

  resetTrackingModules(modules) {
    if (this.isDownloadingModules() || this.isInstallingModules()) { return; }

    this.sendEventAsync('reset-all-installed-modules', {});
    this.zone.run(() => {
      this.trackedModules = {};
      this.updateTrackedModules(modules);
    });
  }

  updateTrackedModules(modules = []) {
    modules.forEach((m) => {
      this.updateOneTrackedModule(m);
    });
  }

  updateOneTrackedModule(module) {
    if (!module.latest_version || this.trackedModules[module.id]) { return; }

    this.trackedModules[module.id] = {};
    this.sendEventAsync('module-latest-version', module.latest_version);
  }

  downloadNewVersion(version) {
    const currentModule = this.trackedModules[version.vr_module_id];
    currentModule.downloading = true;
    this.sendEventAsync('download-new-module-version', version);
  }

  installNewVersion(version) {
    const currentModule = this.trackedModules[version.vr_module_id];
    currentModule.installing = true;
    this.sendEventAsync('install-new-module-version', version);
  }

  pauseDownloadNewVersion(version) {
    const currentModule = this.trackedModules[version.vr_module_id];
    currentModule.paused = true;
    this.sendEventAsync('module-version-pause-downloading', version);
  }

  resumeDownloadNewVersion(version) {
    const currentModule = this.trackedModules[version.vr_module_id];
    currentModule.paused = false;
    this.sendEventAsync('module-version-resume-downloading', version);
  }

  cancelDownloadNewVersion(version) {
    const currentModule = this.trackedModules[version.vr_module_id];
    currentModule.downloading = false;
    currentModule.paused = false;
    currentModule.ratio = 0;
    this.sendEventAsync('module-version-cancel-downloading', version);
  }

  isDownloadingModules() {
    return Object.values(this.trackedModules).some((m: any) => m.downloading);
  }

  isInstallingModules() {
    return Object.values(this.trackedModules).some((m: any) => m.installing);
  }

  trackDownloadProgress() {

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

    this.events.subscribe('module-version-size', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.size = versionData.size;
        currentModule.downloaded_size = 0;
        currentModule.ratio = 0;
      });
    });

    this.events.subscribe('module-version-downloading-progress', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.downloaded_size += versionData.data;
        currentModule.ratio = (currentModule.downloaded_size / currentModule.size);
      });
    });

    this.events.subscribe('module-version-downloaded', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.ratio = 1;
        currentModule.new_version = null;
        currentModule.downloading = false;
        this.helperService.showToast(`The version ${versionData.name} is downloaded successfully`);
      });
    });

    this.events.subscribe('module-version-installed', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.new_version_not_installed = null;
        currentModule.installing = false;
        this.helperService.showToast(`The version ${versionData.name} is installed successfully`);
      });
    });

    this.events.subscribe('module-version-download-error', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.downloading = false;
        this.helperService.showError(`An error while downloading the version ${versionData.name}`);
      });
    });

    this.events.subscribe('module-version-install-error', (versionData) => {
      this.zone.run(() => {
        const currentModule = this.trackedModules[versionData.vr_module_id];
        currentModule.installing = false;
        this.helperService.showError(`An error while installing the version ${versionData.name}`);
      });
    });
  }
}
