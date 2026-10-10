// Karma configuration file
// Run tests:    npx ng test
// Coverage:     npx ng test --code-coverage

const path = require('path');

module.exports = function (config) {
  config.set({

    // ── Base path ──────────────────────────────────────────────────────────
    basePath: '',

    // ── Frameworks ────────────────────────────────────────────────────────
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    // ── Plugins ───────────────────────────────────────────────────────────
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-edge-launcher'),          // added: Edge support
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],

    // ── Client config ─────────────────────────────────────────────────────
    client: {
      jasmine: {
        // Uncomment to run only tests matching a pattern:
        // grep: 'ReportComponent'

        // Set false while diagnosing the Edge crash so test order is
        // consistent across runs. Re-enable once Edge is stable.
        random: false,
      },
      clearContext: false, // keep Jasmine Spec Runner output visible in browser
    },

    // ── Reporters ─────────────────────────────────────────────────────────
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },

    coverageReporter: {
      dir: path.join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html'     }, // browse coverage/index.html
        { type: 'text'     }, // prints table to terminal
        { type: 'lcovonly' }, // for CI / SonarQube
      ],
      // ── Enforce 90 % thresholds ──────────────────────────────────────────
      check: {
        global: {
          statements : 90,
          branches   : 85,
          functions  : 90,
          lines      : 90,
        },
      },
    },

    reporters: ['progress', 'kjhtml', 'coverage'],

    // ── Browser launchers ─────────────────────────────────────────────────
    customLaunchers: {
      // Use ChromeHeadless for CI / no-GUI environments (was already
      // commented out above — moved here so Edge sits alongside it).
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
      // EdgeHeadless: reduces memory pressure that causes Edge to disconnect
      // mid-run. --js-flags gives V8 extra heap for TestBed compilation.
      EdgeHeadless: {
        base: 'Edge',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--js-flags=--max-old-space-size=4096',
        ],
      },
    },

    // Local dev: ['Chrome']
    // With Edge:  ['Chrome', 'EdgeHeadless']
    // CI:         ['ChromeHeadlessCI', 'EdgeHeadless']
    browsers: ['Chrome', 'EdgeHeadless'],

    // ── Edge disconnect fixes ─────────────────────────────────────────────
    // Default 2 000 ms is too short; Edge needs more time to reattach
    // after heavy TestBed setup (zone.js, sessionStorage, btoa JWT calls).
    browserDisconnectTimeout  : 10000,  // ms — was 2 000 (default)
    browserDisconnectTolerance: 3,      // retries before failing — was 0
    browserNoActivityTimeout  : 60000,  // ms — was 10 000 (default)
    captureTimeout            : 60000,  // ms — time for browser to connect on launch

    // ── Misc ──────────────────────────────────────────────────────────────
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    // Switch to LOG_DEBUG to print each spec name as it starts — the last
    // line before a disconnect tells you exactly which test crashes Edge:
    // logLevel: config.LOG_DEBUG,
    autoWatch: true,
    singleRun: false,   // set true in CI
    restartOnFileChange: true,
  });
};