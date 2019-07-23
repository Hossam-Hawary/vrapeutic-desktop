import { ChartsService } from './../../services/charts/charts.service';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {
  patientId;
  moduleId;
  sessions: any[] = [];
  sessionStatistics: any[] = [];
  constructor(
    public chartsService: ChartsService,
    private userService: UserService,
    private helperService: HelperService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('patient_id');
    this.moduleId = this.route.snapshot.paramMap.get('module_id');
    this.ModuleSessions();
    this.chartsService.getModuleStatistics(
        { patient_id: this.patientId, vr_module_id: this.moduleId });

  }

  async ModuleSessions() {
    try {
      await this.helperService.showLoading();
      this.sessions = await this.userService.getPatientModuleSessions(this.patientId, this.moduleId) as any[];
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  async getStatistics(sessionId) {
    try {
      await this.helperService.showLoading();
      this.sessionStatistics = await this.chartsService.sessionStatistics(sessionId) as any[];
      // TODO: You can use session's statistics as you like
      this.helperService.removeLoading();
    } catch (err) {
      this.helperService.showError(err);
    }
  }
}
