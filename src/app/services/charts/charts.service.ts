import { Injectable } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

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
      this.dayStatistics(result);
      this.weekStatistics(result);
      return true;
    } catch (err) {
      console.log('Error with Statistics', err);
      return false;
    }
  }

  dayStatistics(result) {
    this.lineChartLabels = result.data.by_day.map((item) => item.date);
    const attentions = result.data.by_day.map((item) => (item.attention / item.duration).toFixed(2));
    const distraction = result.data.by_day.map((item) => (item.distraction / item.duration).toFixed(2));
    this.lineChartData = [
      { data: attentions, label: 'Attention' },
      { data: distraction, label: 'Distruction' }
    ];
  }

  weekStatistics(result) {
    this.barChartLabels = result.data.by_week.map((item) => 'Week ' + item.week);
    const attentions = result.data.by_week.map((item) => (item.attention / item.duration).toFixed(2));
    const distraction = result.data.by_week.map((item) => (item.distraction / item.duration).toFixed(2));
    this.barChartData = [
      { data: attentions, label: 'Attention' },
      { data: distraction, label: 'Distruction' }
    ];
  }

}
