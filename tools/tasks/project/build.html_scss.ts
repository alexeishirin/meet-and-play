import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as merge from 'merge-stream';
import { join } from 'path';

import {DEPENDENCIES, APP_SRC, TMP_DIR, CSS_DEST, APP_DEST, BROWSER_LIST, ENV, CSS_PROD_BUNDLE} from '../../config';

const plugins = <any>gulpLoadPlugins();
const cleanCss = require('gulp-clean-css');

const processors = [
  autoprefixer({
    browsers: BROWSER_LIST
  })
];

const isProd = ENV === 'prod';

if (isProd) {
  processors.push(
    cssnano({
      discardComments: {removeAll: true}
    })
  );
}

/**
 * Copies all HTML files in `src/client` over to the `dist/tmp` directory.
 */
function prepareTemplates() {
  return gulp.src(join(APP_SRC, '**', '*.html'))
    .pipe(gulp.dest(TMP_DIR));
}

function processComponentScss() {
  return gulp.src([
      join(APP_SRC, '**', '*.scss'),
      '!' + join(APP_SRC, 'assets', '**', '*.scss')
    ])
    .pipe(isProd ? plugins.cached('process-component-scss') : plugins.util.noop())
    .pipe(isProd ? plugins.progeny() : plugins.util.noop())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({includePaths: require('node-bourbon').includePaths}).on('error', plugins.sass.logError))
    .pipe(plugins.postcss(processors))
    .pipe(plugins.sourcemaps.write(isProd ? '.' : ''))
    .pipe(gulp.dest(isProd ? TMP_DIR: APP_DEST));
}

function processExternalScss() {
  return gulp.src(getExternalScss().map(r => r.src))
    .pipe(isProd ? plugins.cached('process-external-scss') : plugins.util.noop())
    .pipe(isProd ? plugins.progeny() : plugins.util.noop())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({includePaths: ['./node_modules/']}).on('error', plugins.sass.logError))
    .pipe(plugins.postcss(processors))
    // .pipe(isProd ? plugins.concatCss(CSS_PROD_BUNDLE) : plugins.util.noop())
    // .pipe(isProd ? cleanCss() : plugins.util.noop())
    .pipe(plugins.sourcemaps.write(isProd ? '.' : ''))
    .pipe(gulp.dest(CSS_DEST));
}

function getExternalScss() {
  return DEPENDENCIES.filter(d => /\.scss$/.test(d.src));
}


export = () => merge(processComponentScss(), prepareTemplates(), processExternalScss());
