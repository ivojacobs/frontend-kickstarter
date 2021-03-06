'use strict';

const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const del = require('del');
const runSequence = require('run-sequence');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('assets', () =>
  gulp
    .src('src/assets/**/*')
    .pipe(gulp.dest('dist/assets'))
);

gulp.task('favicon', () =>
  gulp
    .src([
      'src/favicon*.*'
    ], { base: 'src' })
    .pipe(gulp.dest('dist'))
);

const getData = (file) => {
  //const dataPath = path.resolve('./src/views/data/' + path.basename(file.path, '.html') + '.json')
  const dataPath = 'src/views/data/global.json'
  let data = {};

  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch(e) {
    // Don't fail if the JSON is badly formed or the file doesn't exist
  } finally {
    return data;
  }
};

gulp.task('views', () =>
  gulp
    .src([
      'src/views/**/*.html',
      '!src/views/**/_*.html'
    ], { base: 'src/views' })
    .pipe($.useref())
    .pipe($.data(getData))
    .pipe($.nunjucks.compile())
    .pipe(gulp.dest('dist'))
);

gulp.task('scripts', () =>
  gulp
    .src([
      'src/scripts/**/*.js'
    ], { base: 'src' })
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/'))
);

gulp.task('styles', () =>
  gulp
    .src('src/styles/*.{scss,css}')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      precision: 10,
      includePaths: [
        // Include node packages as a souce for @import statements
        __dirname + "/" + "node_modules/bootstrap-sass/assets/stylesheets"
      ]
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['last 2 versions'], remove: false }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(browserSync.stream({ match: '**/*.css' }))
);

gulp.task('default', ['build'], () => {
  browserSync({
    notify: false,
    server: {
        baseDir: "dist",
        routes: {
            "/node_modules": "node_modules"
        }
    },
    https: false,
    logConnections: true,
    open: false
  });

  gulp.watch('src/**/*.{scss,css}', ['styles']);
  gulp.watch([
    'src/views/**/*.html',
    'src/views/data/*.json'
  ], ['views']);
  gulp.watch('src/assets/**/*.{woff,woff2,txt,jpg,png,gif,svg}', ['assets']);
  gulp.watch('src/scripts/**/*.js', ['scripts']);
  gulp.watch([
    'dist/**/*.html',
    'dist/scripts/**/*.js',
    'dist/assets/*.{woff,woff2,txt,jpg,png,gif,svg}',
    'dist/styles/*.css'
  ]).on('change', browserSync.reload);
});

gulp.task('clean', () => del(['dist'], { dot: true }));

gulp.task('build', callback => {
  runSequence(
    'clean', [ 'assets', 'views', 'styles', 'scripts', 'favicon' ],
  callback);
});
