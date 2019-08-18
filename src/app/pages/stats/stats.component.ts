import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, OnDestroy} from '@angular/core';
import { Chart } from 'chart.js';

import {configs} from './configs';
import {ChartsConfig} from './chartsConfig';

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
  @ViewChild('canvas', { static: true}) canvas: ElementRef;
  public context: CanvasRenderingContext2D;

  fieldsNames: any[];
  validData: any[];
  fieldsDataTypes: any[];
  zip: any;
  chartsSettings: ChartsConfig[];
  charts: Chart[];
  curModuleName: string;
  index = 0;
  tooltipMap: Map<string, Map<string, any[]>>;

  constructor() {
  }

  ngOnInit() {
    this.zip = (a: any, b: any) => a.map((x: any, i: any) => [x, b[i]]);
    this.initModule(this.index);

    console.log('stats');
    console.log(this.allData);
  }

  ngOnDestroy() {
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      chart.dataX = [];
      chart.dataY = [];
      chart.tooltipData = [];
    });
  }

  initModule(index: number) {
    this.fieldsNames = configs[index].fieldsConfig.fieldsNames;
    this.fieldsDataTypes = configs[index].fieldsConfig.fieldsDataTypes;
    this.chartsSettings = configs[index].chartsConfigs;
    this.curModuleName = configs[index].moduleName;

    this.tooltipMap = new Map<string, Map<string, any[]>>();
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      let map: Map<string, any[]> = new Map<string, any[]>();
      chart.tooltipFields.forEach((toolTipField: string) => {
        map.set(toolTipField, []);
      })
      this.tooltipMap.set(chart.id, map);
    });

    this.charts = [];

    this.validData = this.validateData(this.allData);
    this.collectStatsData(this.chartsSettings, this.validData);
  }

  ngAfterViewInit(): void {
    if (this.validData.length) {
      this.buildCharts(this.chartsSettings);
    }
  }

  validateData(data: any): any[] {
    data = this.validateFieldName(data, this.fieldsNames);
    data = this.validateDataType(data, this.fieldsDataTypes);
    return data;
  }

  validateFieldName(data: any, validationData: any[]): any[] {
    const filteredData: any[] = [];

    data.forEach((datum: any) => {
      const actualKeys = Object.keys(datum);
      const expectedKeys = Object.values(validationData);

      let valid = true;
      for (const [actual, expected] of this.zip(actualKeys, expectedKeys)) {
        valid = valid && (actual === expected);
      }

      if (valid === true) {
        filteredData.push(datum);
      }
    });

    return filteredData;
  }

  validateDataType(data: any[], validationData: any[]): any[] {
    const filteredData: any[] = [];

    data.forEach((datum: any) => {
      const actualDatatypes = Object.values(datum)
                                    .map(val => typeof(val));
      const expectedDatatypes = Object.values(validationData);

      let valid = true;
      for (const [actual, expected] of this.zip(actualDatatypes, expectedDatatypes)) {
        valid = valid && (actual === expected);
      }

      if (valid === true) {
        filteredData.push(datum);
      }
    });

    return filteredData;
  }

  collectStatsData(chartsData: ChartsConfig[], data: any[]) {
    chartsData.forEach((chart: ChartsConfig) => {
      let i: number = 1;
      data.forEach((datum: any) => {
        const keys = Object.keys(datum);
        const values = Object.values(datum);

        let foundY: boolean = false;

        for (const [key, value] of this.zip(keys, values)) {
          if (key == chart.fieldNameY && value >= 0.0) {
            foundY = true;
            chart.dataY.push((value).toFixed(2));
          }
        }

        if (foundY) {
          let tempTooltipData: any[] = []
          for (const [key, value] of this.zip(keys, values)) {
            if (key === chart.fieldNameX) {
              chart.dataX.push("Game #" + (i++).toString());
            } 
            
            chart.tooltipFields.forEach((tooltipField: string) => {
              if(key == tooltipField) {
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
        chart.tooltipData.push(this.tooltipMap.get(chart.id).get(tooltipField));
      });
      console.log(chart.tooltipData);
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
                label: function(tooltipItems: Chart.ChartTooltipItem, data: Chart.ChartData) {
                  let tooltipDataArr = ["score: " + tooltipItems.yLabel + "%"];
                  chartConfigs.tooltipFields.forEach((tooltipField: string, index: number) => {
                    let tooltip = chartConfigs.tooltipData[index][tooltipItems.index];
                    if (tooltip.length) {
                      tooltipDataArr.push(tooltipField + ": " + tooltip);
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
