module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    requireModule: [],
    format: ['progress-bar', 'html:cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 2,
    paths: ['features/**/*.feature'],
    publishQuiet: true,
    worldParameters: {
      gameEngine: null,
    }
  }
};
