import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Events } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class MainEventsService {


  constructor(
    private electronService: ElectronService,
    private events: Events) {}

  sendEventAsync(eventName, options) {
    return this.electronService.ipcRenderer.send(eventName, options);
  }

  sendEventSync(eventName, options) {
    return this.electronService.ipcRenderer.sendSync(eventName, options);
  }

  removeAllListeners(eventName) {
    return this.electronService.ipcRenderer.removeAllListeners(eventName);
  }

  listenOnMainEvents() {
    if (!this.electronService.ipcRenderer) { return; }

    const mainEvents = [
      'mode-switched', 'device-connected', 'device-disconnected', 'authorized-devices-changed',
      'offline-headset-ready', 'desktop-module-ready', 'main-error', 'unauthorized-device-connected'
    ];

    mainEvents.forEach((evName) => {
      this.electronService.ipcRenderer.on(evName, (ev, options) => {
        console.log(evName, options);
        this.events.publish(evName, options);
      });
    });
  }
}
