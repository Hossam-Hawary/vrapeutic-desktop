import {Chart} from 'chart.js';

export class ChartsConfig {
    id: string;
    chartType: string;
    fieldNameX: string;
    fieldNameY: string;
    dataX: any[];
    dataY: any[];
    color: string;
    chartObject: Chart;
    show: boolean;
    legend: string;
}
