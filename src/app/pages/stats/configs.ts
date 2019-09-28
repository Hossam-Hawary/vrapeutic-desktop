
export let configs = {
  4: {
    moduleName: 'Maze Arabic',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'bar',
        fieldNameX: 'attempt_end_time',
        fieldNameY: 'open_time_score',
        tooltipFields: ['level', 'character', 'distractor', 'environment', 'maze_path'],
        dataX: [],
        dataY: [],
        tooltipData: [],
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Open Time Task - Score %'
      },
      {
        id: '2',
        chartType: 'bar',
        fieldNameX: 'attempt_end_time',
        fieldNameY: 'close_time_score',
        tooltipFields: ['level', 'character', 'distractor', 'environment', 'maze_path'],
        dataX: [],
        dataY: [],
        tooltipData: [],
        color: 'red',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Close Time Task - Score %'
      }
    ],
    fieldsConfig: {
      fieldsNames: [
        'character',
        'collectibles',
        'distractor',
        'maze_path',
        'environment',
        'session_start_time',
        'attempt_start_time',
        'attempt_end_time',
        'expected_duration_in_seconds',
        'actual_duration_in_seconds',
        'open_time_score',
        'close_time_score',
        'level',
        'attempt_type'
      ],
      fieldsDataTypes: [
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'number',
        'number',
        'number',
        'number',
        'string',
        'string'
      ]
    }
  },
  7: {
    moduleName: 'Archeeko',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'bar',
        fieldNameX: 'attempt_end_time',
        fieldNameY: 'score',
        tooltipFields: ['level', 'distance', 'attempt_type', 'total_arches_count', 'success_arches_count'],
        dataX: [],
        dataY: [],
        tooltipData: [],
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Archeeko - Score %'
      }
    ],
    fieldsConfig: {
      fieldsNames: [
        'session_start_time',
        'attempt_start_time',
        'attempt_end_time',
        'expected_duration_in_seconds',
        'actual_duration_in_seconds',
        'level',
        'attempt_type',
        'total_arches_count',
        'consumed_arches',
        'remaining_count',
        'success_arches_count',
        'distance',
        'total_prizes',
        'remaining_prizes',
        'score'
      ],
      fieldsDataTypes: [
        'string',
        'string',
        'string',
        'number',
        'number',
        'string',
        'string',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number'
      ]
    }
  },
  8: {
    moduleName: 'GardenDo',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'bar',
        fieldNameX: 'attempt_end_time',
        fieldNameY: 'score',
        tooltipFields: ['level', 'attempt_type', 'focused_time', 'estmation_time'],
        dataX: [],
        dataY: [],
        tooltipData: [],
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'GardenDo - Score %'
      }
    ],
    fieldsConfig: {
      fieldsNames: [
        'session_start_time',
        'attempt_start_time',
        'attempt_end_time',
        'expected_duration_in_seconds',
        'actual_duration_in_seconds',
        'level',
        'attempt_type',
        'score',
        'flower_sustained',
        'well_sustained',
        'total_sustained',
        'non_sustained',
      ],
      fieldsDataTypes: [
        'string',
        'string',
        'string',
        'number',
        'number',
        'string',
        'string',
        'number',
        'number',
        'number',
        'number',
        'number'
      ]
    }
  }
};
