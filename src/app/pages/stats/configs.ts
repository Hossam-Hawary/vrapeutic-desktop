
export let configs = {
  4: {
    moduleName: 'Maze Arabic',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'open_time_score',
        tooltipFields: ['level', 'character', 'distractor', 'environment', 'maze_path'],
        dataX: [],
        dataY:  {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Open Time Task',
        canGroupBy: ['', 'level', 'character', 'distractor', 'environment', 'maze_path'],
        canBeFieldY: ['open_time_score', 'close_time_score', 'actual_duration_in_seconds'],
        groupBy: ''
      },
      {
        id: '2',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'close_time_score',
        tooltipFields: ['level', 'character', 'distractor', 'environment', 'maze_path'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'red',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Close Time Task',
        canGroupBy: ['', 'level', 'character', 'distractor', 'environment', 'maze_path'],
        canBeFieldY: ['open_time_score', 'close_time_score', 'actual_duration_in_seconds'],
        groupBy: ''
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
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level', 'distance'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Archeeko',
        canGroupBy: ['', 'level', 'distance'],
        canBeFieldY: ['score', 'success_arches_count', 'consumed_arches', 'remaining_arches',
          'total_prizes', 'remaining_prizes', 'actual_duration_in_seconds', 'distance'],
        groupBy: ''
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
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'GardenDo',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['score', 'flower_sustained', 'well_sustained', 'total_sustained',
         'non_sustained', 'actual_duration_in_seconds'],
        groupBy: ''
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
  },
  9: {
    moduleName: 'ArcheekoENG',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level', 'distance'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Archeeko',
        canGroupBy: ['', 'level', 'distance'],
        canBeFieldY: ['score', 'success_arches_count', 'consumed_arches', 'remaining_arches',
          'total_prizes', 'remaining_prizes', 'actual_duration_in_seconds', 'distance'],
        groupBy: ''
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
  10: {
    moduleName: 'ArcheekoSU',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level', 'distance'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'Archeeko',
        canGroupBy: ['', 'level', 'distance'],
        canBeFieldY: ['score', 'success_arches_count', 'consumed_arches', 'remaining_arches',
          'total_prizes', 'remaining_prizes', 'actual_duration_in_seconds', 'distance'],
        groupBy: ''
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
  11: {
    moduleName: 'GardenDoENG',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'GardenDo',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['score', 'flower_sustained', 'well_sustained', 'total_sustained',
          'non_sustained', 'actual_duration_in_seconds'],
        groupBy: ''
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
  },
  12: {
    moduleName: 'GardenDoSU',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'attempt_start_time',
        fieldNameY: 'score',
        tooltipFields: ['level'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'GardenDo',
        canGroupBy: ['', 'level'],
        canBeFieldY: ['score', 'flower_sustained', 'well_sustained', 'total_sustained',
          'non_sustained', 'actual_duration_in_seconds'],
        groupBy: ''
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
  },
  13: {
    moduleName: 'IllyTale',
    chartsConfigs: [
      {
        id: '1',
        chartType: 'line',
        fieldNameX: 'start_time',
        fieldNameY: 'score',
        tooltipFields: ['start_time'],
        dataX: [],
        dataY: {},
        tooltipData: {},
        color: 'blue',
        backgroundColor: 'white',
        chartObject: null,
        show: true,
        legend: 'IllyTale',
        canGroupBy: [''],
        canBeFieldY: [],
        groupBy: ''
      }
    ],
    fieldsConfig: {
      start_time: 'string',
      end_time: 'string',
      score: 'number',
    }
  }
};
