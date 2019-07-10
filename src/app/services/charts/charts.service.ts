import { Injectable } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {
  sessionsStatistics;
  ///////////////////////////////// line chart

  public lineChartOptions: (ChartOptions & { annotation: any, responsive: any }) = {
    responsive: true,
    annotation: true
  };
  public chartColors: Color[] = [
    {
      borderColor: 'rgba(100,201,31)',
      backgroundColor: 'rgba(100,201,31,0.3)',
    },
    {
      borderColor: 'rgba(155,54,224)',
      backgroundColor: 'rgba(155,54,224,0.3)',
    },
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  public lineChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Attention' },
    { data: [87, 99, 60, 41, 98, 25, 30], label: 'Distruction' },
  ];
  public lineChartLabels: Label[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

  ///////////////////////////////// Bar chart

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Attention' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Distruction' }
  ];

  constructor(private api: ApiService) {
  }

  async getModuleStatistics(options) {
    try {
      const result: any = await this.api.get(`/statistics`, options);
      if (!result.length) { return; }

      this.sessionsStatistics = result;
      const session = this.sessionsStatistics[2];
      const data = session[1].data;
      const label = `${(new Date(session[0])).toDateString()} ${session[1].label}`;
      const labels = session[1].labels.map(date => (new Date(date)).toLocaleTimeString());

      this.barChartData = this.lineChartData = [{ data, label}];
      this.barChartLabels = this.lineChartLabels = labels;
      return true;
    } catch (err) {
      console.log('Error with Statistics', err);
      return false;
    }
  }
}
