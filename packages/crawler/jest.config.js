module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['html', 'text', 'lcov'],
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: '义乌购爬虫测试报告',
      outputPath: './test-report/index.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: true,
      dateFormat: 'yyyy-mm-dd HH:MM:ss'
    }]
  ],
  testTimeout: 60000,
}; 