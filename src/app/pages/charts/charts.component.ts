import { ChartsService } from './../../services/charts/charts.service';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { HelperService } from './../../services/helper/helper.service';
import { ActivatedRoute } from '@angular/router';
import { StatsComponent } from '../stats/stats.component';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent implements OnInit {
  patientId;
  moduleId;
  selectedSessionId;
  sessions: any[] = [];
  sessionStatistics: any[] = [];
  allSessionsStatistics: any[] = [];
  showStats = false;
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
    this.selectedSessionId = sessionId;
    try {
      await this.helperService.showLoading();
      this.showStats = false;
      this.sessionStatistics = await this.chartsService.loadSessionStatistics(sessionId) as any[];
      this.helperService.removeLoading();
      this.showStats = true;
      // TODO: You can use session's statistics as you like

      // [
      //     {
      //       "score": 0.15,
      //       "character": "Hussein",
      //       "Collectable": "Gem",
      //       "distractor": "Camel",
      //       "maze_path": "Circle",
      //       "environment": "Desert",
      //       "session_start_time": "2019-07-10T21:07:54.940Z",
      //       "attempt_start_time": "2019-07-10T21:22:54.940Z",
      //       "attempt_end_time": "2019-07-10T21:23:32.940Z",
      //       "attempt_expected_time": "2019-07-10T21:23:24.940Z",
      //       "expected_duration_in_seconds": 30,
      //       "actual_duration_in_seconds": 38,
      //       "level": "1"
      //     },
      //     {
      //       ....
      //     }
      // ]
    } catch (err) {
      this.helperService.showError(err);
    }
  }

  async getAllSessionsStatisticsMerged() {
    this.allSessionsStatistics = await this.getAllSessionsStatistics() as any[];
    console.log(this.allSessionsStatistics);
    if (!this.allSessionsStatistics.length) { return; }

    // use statistics here

    //   [
    //     {
    //       "score": 0.15,
    //       "character": "Hussein",
    //       "Collectable": "Gem",
    //       "distractor": "Camel",
    //       "maze_path": "Circle",
    //       "environment": "Desert",
    //       "session_start_time": "2019-07-10T21:07:54.940Z",
    //       "attempt_start_time": "2019-07-10T21:22:54.940Z",
    //       "attempt_end_time": "2019-07-10T21:23:32.940Z",
    //       "attempt_expected_time": "2019-07-10T21:23:24.940Z",
    //       "expected_duration_in_seconds": 30,
    //       "actual_duration_in_seconds": 38,
    //       "level": "1"
    //     },
    //     {
    //       ....
    //     }
    // ]
   }
  async getAllSessionsStatisticsGroupedBySession() {
    this.allSessionsStatistics = await this.getAllSessionsStatistics('session') as any[];
    if (!this.allSessionsStatistics.length) { return; }

    // use statistics here

    // [
      // {
      //   "session_date": "2019-07-13T01:37:52.000+02:00",
      //     "session_statistics": [
      //       {
      //         "score": 0.15,
      //         "character": "Hussein",
      //         "Collectable": "Gem",
      //         "distractor": "Camel",
      //         "maze_path": "Circle",
      //         "environment": "Desert",
      //         "session_start_time": "2019-07-10T21:07:54.940Z",
      //         "attempt_start_time": "2019-07-10T21:22:54.940Z",
      //         "attempt_end_time": "2019-07-10T21:23:32.940Z",
      //         "attempt_expected_time": "2019-07-10T21:23:24.940Z",
      //         "expected_duration_in_seconds": 30,
      //         "actual_duration_in_seconds": 38,
      //         "level": "1"
      //       },
      //       {
      //         ...
      //       }
      //     ]
      // },
      // {
      //  "session_date": "2019-06-13T01:37:52.000+02:00",
      //  "session_statistics": [{...},{...}]
      // }
    // ]
  }

  async getAllSessionsStatisticsGroupedByWeek() {
    this.allSessionsStatistics = await this.getAllSessionsStatistics('week') as any[];
    if (!this.allSessionsStatistics.length) { return; }

    // use statistics here

    // [
    //   [
    //     "July 20, 2019", // beginning of week date (saturday)
    //     0.1
    //   ],
    //   [
    //     "July 06, 2019",
    //     0.7627272727272726
    //   ]
    // ]
  }

  async getAllSessionsStatisticsGroupedByMonth() {
    this.allSessionsStatistics = await this.getAllSessionsStatistics('month') as any[];
    if (!this.allSessionsStatistics.length) { return; }

    // use statistics here

    // [
    //   [
    //     "July 01, 2019", // beginning of month date
    //     0.1
    //   ],
    //   [
    //     "June 01, 2019",
    //     0.7627272727272726
    //   ]
    // ]
  }

  async getAllSessionsStatistics(groupedBy = null) {
    // groupedBy: week, month, session
    // groupedBy null will get all sessions in one array
    try {
      await this.helperService.showLoading();
      const params = { patient_id: this.patientId, vr_module_id: this.moduleId, grouped_by: groupedBy };
      const result: any[] = await this.chartsService.loadAllSessionsStatistics(params) as any[];
      this.helperService.removeLoading();
      return result;
    } catch (err) {
      this.helperService.showError(err);
    }
  }
}
