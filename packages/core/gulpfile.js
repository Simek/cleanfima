/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const cssnano = require('cssnano');
const del = require('del');
const gulp = require('gulp');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const postcssPresetInfima = require('postcss-preset-infima');
const webserver = require('gulp-webserver');
const vinylPaths = require('vinyl-paths');

function transformStyles() {
  const modernPreset = postcssPresetInfima();
  return gulp
    .src('./themes/**/*.css', {
      ignore: [
        '**/_*', // Exclude files starting with '_'.
        '**/_*/**', // Exclude entire directories starting with '_'.
      ],
    })
    .pipe(postcss(modernPreset.plugins, { syntax: modernPreset.syntax }))
    .pipe(gulp.dest('./dist/css'));
}

function convertStylesToCSSFiles() {
  return gulp
    .src('./styles/**/*.scss')
    .pipe(rename({ extname: '.css' }))
    .pipe(gulp.dest('./styles'));
}

function removeTemporaryCSSFiles() {
  return gulp
    .src('./styles/**/*.css')
    .pipe(vinylPaths(del));
}

function transformScripts() {
  // Only copy for now. In future run through Babel.
  return gulp.src('./js/**/*.js').pipe(gulp.dest('./dist/js'));
}

function minifyStyles() {
  return gulp
    .src('./dist/css/**/*.css')
    .pipe(rename({ suffix: '.min' }))
    .pipe(postcss([cssnano()]))
    .pipe(gulp.dest('./dist/css'));
}

function minifyScripts() {
  return gulp
    .src('./dist/js/**/*.js')
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'));
}

function copyStylesToDemo() {
  return gulp.src('./dist/css/**/*.css').pipe(gulp.dest('./demo/css'));
}

function copyScriptsToDemo() {
  return gulp.src('./dist/js/**/*.js').pipe(gulp.dest('./demo/js'));
}

function serve() {
  return gulp.src('./demo').pipe(
    webserver({
      livereload: true, // Not working. Figure out why.
      open: true,
    }),
  );
}

function clean() {
  return del(['./dist/**/*', './demo/css/**', './demo/js/**']);
}

const transformAssets = gulp.parallel(transformStyles, transformScripts);
const copyAssetsToDemo = gulp.parallel(copyStylesToDemo, copyScriptsToDemo);
const minifyAssets = gulp.parallel(minifyStyles, minifyScripts);
const transformAndCopy = gulp.series(
  convertStylesToCSSFiles,
  transformAssets,
  copyAssetsToDemo,
  removeTemporaryCSSFiles
);
const transformMinifyAndCopy = gulp.series(
  convertStylesToCSSFiles,
  transformAssets,
  minifyAssets,
  copyAssetsToDemo,
  removeTemporaryCSSFiles
);


function watch(cb) {
  gulp.watch(
    ['./styles/**/*.{css,scss}'],
    gulp.series(convertStylesToCSSFiles, transformStyles, copyStylesToDemo, removeTemporaryCSSFiles),
  );
  gulp.watch(
    ['./js/**/*.js'],
    gulp.series(transformScripts, copyScriptsToDemo),
  );
  cb();
}

exports.clean = clean;
exports.build = gulp.series(clean, transformMinifyAndCopy);
exports.default = gulp.series(clean, watch, transformAndCopy, serve);
