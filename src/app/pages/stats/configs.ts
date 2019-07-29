
export let modules = [
    {
        moduleName: 'Maze Arabic',
        chartsConfigs: [
            {
                id: '1',
                chartType: 'bar',
                fieldNameX: 'session_start_time',
                fieldNameY: 'score',
                dataX: [],
                dataY: [],
                color: 'blue',
                chartObject: null,
                show: true,
                legend: 'Score'
            },
            {
                id: '2',
                chartType: 'bar',
                fieldNameX: 'session_start_time',
                fieldNameY: 'actual_duration_in_seconds',
                dataX: [],
                dataY: [],
                color: 'red',
                chartObject: null,
                show: true,
                legend: 'Actual Duration In Seconds'
            }],
        fieldsConfig: {
            fieldsNames: ['character',
                          'collectibles',
                          'distractor',
                          'maze_path',
                          'environment',
                          'session_start_time',
                          'attempt_start_time',
                          'attempt_end_time',
                          'attempt_expected_time',
                          'expected_duration_in_seconds',
                          'actual_duration_in_seconds',
                          'score',
                          'level'],
            fieldsDataTypes: ['string',
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
                              'string']
        }
    }
];
