import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, OnDestroy } from '@angular/core';
import { Chart } from 'chart.js';

import { configs } from './configs';
import { ChartsConfig } from './chartsConfig';

// Important link
// https://codepen.io/jordanwillis/pen/xqrjGp
// https://stackoverflow.com/questions/42839551/how-to-show-multiple-values-in-point-hover-using-chart-js

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() allData: any[];
  @Input() moduleId: number;
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  public context: CanvasRenderingContext2D;

  validData: any[];
  fieldsConfig: any;
  zip: any;
  validateObject: any;
  chartsSettings: ChartsConfig[];
  charts: Chart[];
  curModuleName: string;
  tooltipMap: Map<string, Map<string, any[]>>;

  constructor() {
  }

  ngOnInit() {
    this.zip = (a: any, b: any) => a.map((x: any, i: any) => [x, b[i]]);
    this.validateObject = (standardObj: any, dataObj: any) => {
      let valid = true;
      Object.keys(standardObj).forEach(key => {
        valid = valid && (standardObj[key] === typeof (dataObj[key]));
      });
      return valid;
    };
    this.initModule(this.moduleId);
  }

  ngOnDestroy() {
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      chart.dataX = [];
      chart.dataY = [];
      chart.tooltipData = [];
    });
  }

  initModule(moduleId: number) {
    this.fieldsConfig = configs[moduleId].fieldsConfig;
    this.chartsSettings = configs[moduleId].chartsConfigs;
    this.curModuleName = configs[moduleId].moduleName;

    this.tooltipMap = new Map<string, Map<string, any[]>>();
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      const map: Map<string, any[]> = new Map<string, any[]>();
      chart.tooltipFields.forEach((toolTipField: string) => {
        map.set(toolTipField, []);
      });
      this.tooltipMap.set(chart.id, map);
    });

    this.charts = [];

    this.validData = this.validateAndFilterData(this.allData);
    this.collectStatsData(this.chartsSettings, this.validData);
  }

  ngAfterViewInit(): void {
    if (this.validData.length) {
      this.buildCharts(this.chartsSettings);
    }
  }

  validateAndFilterData(allData) {
    const filteredData: any[] = [];
    allData.forEach((dataObj: any) => {
      if (this.validateObject(this.fieldsConfig, dataObj)) {
        filteredData.push(dataObj);
      }
    });
    return filteredData;
  }

  collectStatsData(chartsData: ChartsConfig[], data: any[]) {
    chartsData.forEach((chart: ChartsConfig) => {
      let i = 1;
      data.forEach((datum: any) => {
        const keys = Object.keys(datum);
        const values = Object.values(datum);

        let foundY = false;

        for (const [key, value] of this.zip(keys, values)) {
          if (key === chart.fieldNameY && value >= 0.0) {
            foundY = true;
            chart.dataY.push((value).toFixed(2));
          }
        }

        if (foundY) {
          const tempTooltipData: any[] = [];
          for (const [key, value] of this.zip(keys, values)) {
            if (key === chart.fieldNameX) {
              chart.dataX.push('Game #' + (i++).toString());
            }

            chart.tooltipFields.forEach((tooltipField: string) => {
              if (key === tooltipField) {
                this.tooltipMap.get(chart.id).get(tooltipField).push(value);
              }
            });
          }
        }
      });
      while (chart.dataX.length > chart.dataY.length) {
        chart.dataX.pop();
      }
      chart.tooltipFields.forEach((tooltipField: string) => {
        chart.tooltipData.push(this.tooltipMap.get(chart.id).get(tooltipField).toString());
      });
    });
  }

  buildCharts(chartsData: ChartsConfig[]) {
    const allCharts: Chart[] = [];

    chartsData.forEach((chartConfigs: ChartsConfig) => {
      const chart = new Chart(chartConfigs.id, {
        type: chartConfigs.chartType,
        data: {
          labels: chartConfigs.dataX,
          datasets: [
            {
              label: chartConfigs.legend,
              data: chartConfigs.dataY,
              borderColor: chartConfigs.color,
              backgroundColor: chartConfigs.color,
              fill: false,
              borderWidth: 0
            }
          ]
        },
        options: {
          legend: {
            display: true,
            labels: {
              fontColor: chartConfigs.color
            }
          },
          scales: {
            xAxes: [{
              display: true,
              barPercentage: 0.5,
              barThickness: 40,
              maxBarThickness: 50,
              gridLines: {
                offsetGridLines: true
              }
            }],
            yAxes: [{
              display: true,
              ticks: {
                suggestedMax: 100,
                suggestedMin: 0,
                beginAtZero: true
              }
            }],
          },
          tooltips: {
            enabled: true,
            mode: 'single',
            callbacks: {
              label(tooltipItems: Chart.ChartTooltipItem, data: Chart.ChartData) {
                const tooltipDataArr = ['score: ' + tooltipItems.yLabel + '%'];
                chartConfigs.tooltipFields.forEach((tooltipField: string, index: number) => {
                  const tooltip = chartConfigs.tooltipData[index][tooltipItems.index];
                  if (tooltip.length) {
                    tooltipDataArr.push(tooltipField + ': ' + tooltip);
                  }
                });
                return tooltipDataArr;
              }
            },
            titleFontSize: 15,
            bodyFontSize: 15,
            intersect: true
          },
          hover: {
            mode: 'index',
            intersect: true
          },
          responsive: true
        }
      });

      chartConfigs.chartObject = chart;
    });

    return allCharts;
  }

}
