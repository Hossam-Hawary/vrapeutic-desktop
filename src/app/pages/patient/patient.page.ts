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
  showConsole = false;
  id: any;
  production: boolean;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    public mainEventsService: MainEventsService,
    public modalController: ModalController,
    private events: Events
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
      this.modules = await this.userService.getPatientModules(this.id)as any[];
      this.headsets = await this.userService.getCenterHeadsets();
      this.checkModulesUpdates();
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
    return  this.runModuleOffline(module);
    // this.selectHeadset(module);
  }

  async runModuleOffline(module) {
    this.getNewSessionId(
      module,
      this.headsets.find((h) => h.serial === this.mainEventsService.getReadyHeadset()).id
    );
  }

  // async selectHeadset(module) {
  //   const inputs = [];
  //   this.headsets.forEach(headset => {
  //     inputs.push({
  //       type: 'radio',
  //       label: headset.name,
  //       value: headset.id,
  //       checked: this.headsets[0].id === headset.id
  //     });
  //   });

  //   this.helperService.showAlert('', 'Select Headset',
  //     [
  //       {
  //         text: 'Cancel',
  //       }, {
  //         text: 'Start',
  //         handler: (headset) => {
  //           this.getNewSessionId(module, headset);
  //         }
  //       }
  //     ],
  //     true, inputs
  //   );
  // }

  async checkModulesUpdates() {
    this.modules.forEach((m) => {
      if (!m.latest_version) { return; }

      this.mainEventsService.sendEventAsync('module-latest-version', m.latest_version);
    });
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

  toggleConsole() {
    this.showConsole = !this.showConsole;
    this.mainEventsService.sendEventAsync('show-console-log', this.showConsole);
  }

  resetModules() {
    this.mainEventsService.sendEventAsync('reset-all-installed-modules', this.showConsole);
    this.checkModulesUpdates();
  }
}
