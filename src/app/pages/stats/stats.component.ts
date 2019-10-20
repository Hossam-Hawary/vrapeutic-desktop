import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, Output, OnDestroy } from '@angular/core';
import { Chart, InteractionMode, ChartDataSets } from 'chart.js';

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
  validateObject: any;
  chartsSettings: ChartsConfig[];
  charts: Chart[];
  curModuleName: string;
  colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
  selectedChart = '0';
  selectedChartConfigs: ChartsConfig;
  displayedColumns: string[];
  emptyChart = false;
  constructor() {
  }

  ngOnInit() {
    this.validateObject = (dataObj: any) => {
      let valid = true;
      Object.keys(this.fieldsConfig).forEach(key => {
        valid = valid && (this.fieldsConfig[key] === typeof (dataObj[key]));
      });
      return valid;
    };
    this.initModule(this.moduleId);
    // setTimeout(() => {
    //   this.colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
    //   this.buildCharts();
    // }, 500);
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
    this.curModuleName = configs[moduleId].moduleName;
    this.charts = [];
    this.validData = this.validateAndFilterData(this.allData);
    this.displayedColumns = Object.keys(this.fieldsConfig);
    this.chartsSettings = configs[moduleId].chartsConfigs;
    this.selectedChart = this.chartsSettings[0].id;
    this.rebuildChart();
    // this.collectStatsData();
  }

  ngAfterViewInit(): void {
    // if (this.validData.length) {
    //   this.buildCharts();
    // }
  }

  validateAndFilterData(allData) {
    const filteredData: any[] = [];
    allData.forEach((dataObj: any) => {
      if (this.validateObject(dataObj)) {
        filteredData.push(dataObj);
      }
    });
    return filteredData;
  }

  collectStatsData() {
    this.chartsSettings.forEach((chart: ChartsConfig) => {
      const tooltipData = {};
      this.validData.forEach((sessionData: any) => {
        const y = sessionData[chart.fieldNameY].toFixed(2);
        const x = (new Date(sessionData[chart.fieldNameX])).toLocaleTimeString();
        if (y < 0) { return; }
        const dataGroup = sessionData[chart.groupBy] || chart.fieldNameY;
        chart.dataY[dataGroup] = chart.dataY[dataGroup] || [];
        chart.dataY[dataGroup].push(({ x, y}));
        chart.dataX.push(x);
        chart.tooltipFields.forEach((tooltipField: string) => {
          tooltipData[dataGroup] = tooltipData[dataGroup] || {};
          tooltipData[dataGroup][tooltipField] = tooltipData[dataGroup][tooltipField] || [];
          tooltipData[dataGroup][tooltipField].push(sessionData[tooltipField].toString());
        });
      });

      // while (chart.dataX.length > chart.dataY.length) {
      //   chart.dataX.pop();
      // }

      // send the tooltip values to the chart
      chart.tooltipFields.forEach((tooltipField: string) => {
        chart.tooltipData = tooltipData;
      });
    });
  }

  buildCharts() {
    this.collectStatsData();
    const indexedTooltipData = [];
    this.selectedChartConfigs = this.chartsSettings.find((chartConfig) => (chartConfig.id === this.selectedChart));
    const datasets: ChartDataSets[] = Object.entries(this.selectedChartConfigs.dataY).map((entry, index) => {

      indexedTooltipData.push(this.selectedChartConfigs.tooltipData[entry[0]]);
      const color = this.colorsPool.pop();
      return {
        label: `${this.selectedChartConfigs.groupBy || ''} ${entry[0]}`,
        data: entry[1],
        fill: false,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 3
      } as ChartDataSets;
    });
    this.selectedChartConfigs.tooltipData = indexedTooltipData;

    if (!datasets.length) { return this.emptyChart = true; }
    this.emptyChart = false;

    const options = {
        responsive: true,
        legend: {
          display: true,
          labels: {
            fontSize: 16
          }
        },
        title: {
          display: true,
          text: `${this.curModuleName} (${this.selectedChartConfigs.fieldNameY})`,
          fontSize: 18,
          fontColor: this.selectedChartConfigs.color
        },
        hover: {
          mode: 'index' as InteractionMode,
          intersect: true
        },
        tooltips: {
          enabled: true,
          mode: 'single' as InteractionMode,
          titleFontSize: 15,
          bodyFontSize: 15,
          intersect: true,
          displayColors: false,
          callbacks: {
            label: (tooltipItems: Chart.ChartTooltipItem, data: Chart.ChartData) => {
              const tooltipDataArr = ['score: ' + tooltipItems.yLabel + '%'];
              this.selectedChartConfigs.tooltipFields.forEach((tooltipField: string, index: number) => {
                const tooltip = this.selectedChartConfigs.tooltipData[tooltipItems.datasetIndex][tooltipField][tooltipItems.index];
                if (tooltip.length) {
                  tooltipDataArr.push(tooltipField + ': ' + tooltip);
                }
              });
              return tooltipDataArr;
            }
          }
        },
        scales: {
          xAxes: [{
            display: true,
            barPercentage: 0.5,
            barThickness: 40,
            maxBarThickness: 50,
            offset: true,
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
        }
      };
    const chart = new Chart(this.selectedChartConfigs.id, {
      type: this.selectedChartConfigs.chartType,
        data: {
          labels: this.selectedChartConfigs.dataX,
          datasets
        },
        options
      });

    this.selectedChartConfigs.chartObject = chart;
  }

  rebuildChart() {
    if (!this.validData.length) { return this.emptyChart = true; }

    this.chartsSettings.forEach((chart: ChartsConfig) => {
      chart.dataX = [];
      chart.dataY = {};
      chart.tooltipData = [];
      if (chart.chartObject) { chart.chartObject.destroy(); }
    });

    setTimeout(() => {
      this.colorsPool = ['gray', 'black', 'green', 'red', 'blue'];
      this.buildCharts();
    }, 400);
  }

}
