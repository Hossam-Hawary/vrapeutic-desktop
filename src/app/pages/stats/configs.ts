
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
      character: 'string',
      collectibles: 'string',
      distractor: 'string',
      maze_path: 'string',
      environment: 'string',
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      open_time_score: 'number',
      close_time_score: 'number',
      level: 'string',
      attempt_type: 'string'
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
        tooltipFields: ['level', 'distance', 'attempt_type', 'total_arches_count',
          'success_arches_count', 'consumed_arches', 'remaining_arches', 'total_prizes', 'remaining_prizes'],
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
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      total_arches_count: 'number',
      consumed_arches: 'number',
      remaining_arches: 'number',
      success_arches_count: 'number',
      distance: 'number',
      total_prizes: 'number',
      remaining_prizes: 'number',
      score: 'number'
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
        tooltipFields: ['level', 'attempt_type', 'flower_sustained',
          'well_sustained', 'total_sustained', 'non_sustained'],
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
      session_start_time: 'string',
      attempt_start_time: 'string',
      attempt_end_time: 'string',
      expected_duration_in_seconds: 'number',
      actual_duration_in_seconds: 'number',
      level: 'string',
      attempt_type: 'string',
      score: 'number',
      flower_sustained: 'number',
      well_sustained: 'number',
      total_sustained: 'number',
      non_sustained: 'number'
    }
  }
};
