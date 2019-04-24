import { Injectable, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  message: string;

  constructor(private electronService: ElectronService, private ngZone: NgZone) {
    this.electronService.ipcRenderer.on('getFilesResponse', (event, arg) => {
      this.ngZone.run(() => {
        const reply = `Asynchronous message reply:::::${arg}`;
        console.log(reply, arg);
        this.message = reply;
      });
    });
  }


  playPingPong() {
    return this.electronService.ipcRenderer.sendSync('getFiles', 'asdfasdfasldfkjasldfjasl;dkfjla;skdfasdf');
  }

    // this to make it work without errors on browser
    // https://malcoded.com/posts/angular-desktop-electron/
    // if ((window as any).require) {
    //   try {
    //     this.ipc = (window as any).require('electron').ipcRenderer;
    //   } catch (error) {
    //     throw error;
    //   }
    // } else {
    //   console.warn('Could not load electron ipc');
    // }
  // }


  // async getFiles() {
  // //  if (!this.ipc) { return; }

  //   // A production-ready function would need some type of timeout.
  //  return new Promise<string[]>((resolve, reject) => {
  //     ipc.once('getFilesResponse', (event, arg) => {
  //       resolve(arg);
  //     });
  //     ipc.send('getFiles');
  //   });
  // }

  // public on(channel: string, listener: any): void {
  //   if (!ipc) {
  //     return;
  //   }
  //   ipc.on(channel, listener);
  // }

  // public send(channel: string, ...args): void {
  //   if (!ipc) {
  //     return;
  //   }
  //   ipc.send(channel, ...args);
  // }

}
