import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { MainEventsService } from '../../services/main-events/main-events.service';
import { ActivatedRoute } from '@angular/router';
import { ModalController, Events } from '@ionic/angular';
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
  headsetStates = { none: 0, ready: 1, unauthorized: 2, not_ready: 3, preparing: 5 };
  headsetConnectedState = this.headsetStates.none;
  headsetsPrepared = [];
  offlineMode = true;
  id: any;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    private mainEventsService: MainEventsService,
    public modalController: ModalController,
    private events: Events
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadPatient();
    this.setupHeadsetEvents();
    this.setupRunningModulesEvents();
  }

  async loadPatient() {
    try {
      await this.helperService.showLoading();
      this.patient = await this.userService.getPatient(this.id) as any[];
      this.modules = await this.userService.getPatientModules(this.id)as any[];
      this.headsets = await this.userService.getCenterHeadsets();
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  async getNewSessionId(module, headset) {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatientSessionId(this.id, module.id, headset);
      this.mainEventsService.sendEventAsync('run-module',
        {
          moduleId: module.id,
          moduleName: module.name,
          roomId: result.room_id
        });
    } catch (err) {
      console.log('getNewSessionId err', err);
      this.helperService.showError(err);
      return false;
    }
  }

  runModule(module) {
    if (this.offlineMode) {
      return  this.runModuleOffline(module);
    }
    this.selectHeadset(module);

  }

  async runModuleOffline(module) {
    await this.helperService.showLoading();
    this.mainEventsService.sendEventAsync('run-module',
      {
        moduleId: module.id,
        moduleName: module.name,
      });
  }

  async selectHeadset(module) {
    const inputs = [];
    this.headsets.forEach(headset => {
      inputs.push({
        type: 'radio',
        label: headset.name,
        value: headset.id,
        checked: this.headsets[0].id === headset.id
      });
    });

    this.helperService.showAlert('', 'Select Headset',
      [
        {
          text: 'Cancel',
        }, {
          text: 'Start',
          handler: (headset) => {
            this.getNewSessionId(module, headset);
          }
        }
      ],
      true, inputs
    );
  }

  setupHeadsetEvents() {
    this.events.subscribe('device-connected', (device) => {
      this.headsetConnectedState = this.headsetStates.preparing;
      this.preparingConnectedHeadset();
    });

    this.events.subscribe('device-disconnected', () => {
      this.headsetConnectedState = this.headsetStates.none;
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

      if (!this.headsetsPrepared.some((h) => h.id === options.headsetDevice.id )) {
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

  switchMode() {
    this.mainEventsService.sendEventAsync('switch-mode', this.offlineMode);
  }

  preparingConnectedHeadset() {
    this.helperService.showToast('An Authorized device is connected');
    this.helperService.showLoading('We are preparing the headset..., please don\'t unplug it now');
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
}
