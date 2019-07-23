import { Injectable, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  message: string;

  constructor(private electronService: ElectronService, private ngZone: NgZone) {}


  runModule(options) {
    return this.electronService.ipcRenderer.sendSync('run-module', options);
  }

}
