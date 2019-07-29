import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output} from '@angular/core';
import { Chart } from 'chart.js';

import {DBRecords} from './DBRecords';
import {modules} from './configs';
import {ChartsConfig} from './chartsConfig';
import { setClassMetadata } from '@angular/core/src/render3';
import { EventEmitter } from 'events';
import { Subject } from 'rxjs';

// Important link
// https://codepen.io/jordanwillis/pen/xqrjGp

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {

  @Input() allData: any[];
  @ViewChild('canvas') canvas: ElementRef;
  public context: CanvasRenderingContext2D;

  fieldsNames: any[];
  validData: any[];
  fieldsDataTypes: any[];
  zip: any;
  chartsSettings: ChartsConfig[];
  charts: Chart[];
  curModuleName: string;
  index = 0;

  constructor() {
  }

  ngOnInit() {
    this.zip = (a: any, b: any) => a.map((x: any, i: any) => [x, b[i]]);
    // this.allData = DBRecords;
    this.initModule(this.index);

    console.log('stats');
    console.log(this.allData);
  }

  initModule(index: number) {
    this.fieldsNames = modules[index].fieldsConfig.fieldsNames;
    this.fieldsDataTypes = modules[index].fieldsConfig.fieldsDataTypes;
    this.chartsSettings = modules[index].chartsConfigs;
    this.curModuleName = modules[index].moduleName;

    this.charts = [];

    this.validData = this.validateData(this.allData);
    this.collectStatsData(this.chartsSettings, this.validData);
  }

  switchModule(event) {
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
      data.forEach((datum: any) => {
        const keys = Object.keys(datum);
        const values = Object.values(datum);

        for (const [key, value] of this.zip(keys, values)) {
          if (key === chart.fieldNameX) {
            chart.dataX.push(value);
          } else if (key === chart.fieldNameY) {
            chart.dataY.push(value);
          }
        }
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
                fill: true
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
                display: true
              }],
              yAxes: [{
                display: true,
                ticks: {
                  beginAtZero: true
                }
              }],
            },
            tooltips: {
              mode: 'nearest'
            }
          }
        });

      chartConfigs.chartObject = chart;
    });

    return allCharts;
  }

}
