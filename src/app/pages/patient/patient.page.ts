import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from '../../services/helper/helper.service';
import { FileService } from '../../services/file/file.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-patient',
  templateUrl: './patient.page.html',
  styleUrls: ['./patient.page.scss'],
})
export class PatientPage implements OnInit {
  patient: any;
  modules: any;
  id: any;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private helperService: HelperService,
    private fileService: FileService) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadPatient();

  }

  async loadPatient() {
    try {
      await this.helperService.showLoading();
      let result: any = await this.userService.getPatient(this.id);
      this.patient = result.success;
      result = await this.userService.getPatientModules(this.id);
      this.modules = result.success;
      this.helperService.removeLoading();
      return true;
    } catch (err) {
      console.log('loadPatients err', err);
      this.helperService.showError(err);
      return false;
    }
  }

  async getNewSessionId(module) {
    try {
      await this.helperService.showLoading();
      const result: any = await this.userService.getPatientSessionId(this.id, module.id);
      const opened = this.fileService.runModule({ moduleId: module.id, roomId: result.success.room_id });
      console.log(opened);
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

}
