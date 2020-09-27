import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { EditPatientComponent } from '../edit-patient/edit-patient.component';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.page.html',
  styleUrls: ['./patient.page.scss'],
})
export class PatientPage implements OnInit {
  patient: any;
  modules: any[];
  headsets;
  showConsole = false;
  id: any;
  production: boolean;
  wirelessHeadset;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    public mainEventsService: MainEventsService,
    public modalController: ModalController
  ) {
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadPatient();
  }

  async loadPatient() {
    try {
      await this.helperService.showLoading();
      this.patient = await this.userService.getPatient(this.id) as any[];
      this.modules = await this.userService.getPatientModules(this.id) as any[];
      this.headsets = await this.userService.getCenterHeadsets();
      this.mainEventsService.updateTrackedModules(this.modules);
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  runModule(module) {
    if (this.wirelessHeadset) { return this.runModuleOnWirelessHeadset(module); }

    this.runModuleOnUsbHeadset(module);
  }

  async runModuleOnUsbHeadset(module) {
    const readyHeadsetSerial = this.mainEventsService.getReadyHeadset().id;
    const result: any = await this.getNewSessionId(
      module,
      this.headsets.find((h) => h.serial === readyHeadsetSerial).id
    );
    this.mainEventsService.runModuleAfterHeadsetConnected(module.name, module.id, result.room_id);
  }

  async runModuleOnWirelessHeadset(module) {
    const readyHeadsetSerial = this.mainEventsService.getReadyHeadset().id;
    const result: any = await this.getNewSessionId(
      module,
      this.headsets.find((h) => h.serial === readyHeadsetSerial).id
    );
    this.mainEventsService.reconnectHeadsetWirelesslyToRunModule(module.name, module.id, result.room_id);
  }

  async getNewSessionId(module, headset) {
    try {
      await this.helperService.showLoading();
      return await this.userService.getPatientSessionId(this.id, module.id, headset);
    } catch (err) {
      console.log('getNewSessionId err', err);
      this.helperService.showError(err);
      return false;
    }
  }

  async connectToHeadsetWirelessly(ev) {
    await this.helperService.showLoading();
    this.mainEventsService.connectToHeadsetWirelessly(ev.detail.value);
  }

  async editPatient() {
    const modal = await this.modalController.create({
      component: EditPatientComponent,
      componentProps: { patient: this.patient },
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data.patient) { this.patient = data.patient; }
  }

  downloadLatestVersion(vrModule) {
    this.mainEventsService.downloadNewVersion(vrModule.latest_version);
  }

  installLatestVersion(vrModule) {
    this.mainEventsService.installNewVersion(vrModule.latest_version);
  }

  pauseDownloading(vrModule) {
    this.mainEventsService.pauseDownloadNewVersion(vrModule.latest_version);
  }

  resumeDownloading(vrModule) {
    this.mainEventsService.resumeDownloadNewVersion(vrModule.latest_version);
  }

  cancelDownloading(vrModule) {
    this.helperService.showAlert(
      `You are going to cancel downloading ${vrModule.name} updates`,
      'Warning',
      ['Continue Download',
        {
          text: 'Cancel Download',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.cancelDownloadNewVersion(vrModule.latest_version);
          }
        }]
    );
  }

  installAndroid(module) {
    this.mainEventsService.installAndroidModule(module);
  }

  resetModule(module) {
    this.helperService.showAlert(
      `You are going to remove all ${module.name} files from your storage.`,
      'Warning',
      ['Cancel',
        {
          text: 'Clear',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.resetOneTrackingModule(module);
          }
        }]
    );
  }

  resetModules() {
    if (this.mainEventsService.isDownloadingModules() || this.mainEventsService.isInstallingModules()) {
      return this.helperService.showError('We cannot clear modules while downloading or installing modules');
    }

    this.helperService.showAlert(
      'You are going to remove all downloaded modules from your storage.',
      'Warning',
      ['Cancel',
        {
          text: 'Clear All',
          role: 'ok',
          cssClass: 'warning',
          handler: (clear) => {
            this.mainEventsService.resetTrackingModules(this.modules);
          }
        }]
    );
  }

  toggleConsole() {
    this.showConsole = !this.showConsole;
    this.mainEventsService.sendEventAsync('show-console-log', this.showConsole);
  }
}
