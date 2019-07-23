import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { FileService } from '../../services/file/file.service';
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
  id: any;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    private fileService: FileService,
    public modalController: ModalController
  ) {}

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
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  async getNewSessionId(module, headset) {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatientSessionId(this.id, module.id, headset);
      const opened = this.fileService.runModule(
        {
          moduleId: module.id,
          moduleName: module.name,
          roomId: result.room_id
        });
      if (!opened) {
        this.helperService.showError('We couldn\'t launch this module, it might be not downloaded yet!');
      }
      this.helperService.removeLoading();
    } catch (err) {
      console.log('getNewSessionId err', err);
      this.helperService.showError(err);
      return false;
    }
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
}
