/**
 * Copyright 2022 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview Build system based on Gulp.
 */

const gulp = require('gulp');
const rename = require('gulp-rename');
const zip = require('gulp-zip');

/**
 * @return {!Stream}
 */
function packageExtension() {
  const version = require('./manifest.json').version;

  const sources = gulp.src([
    'LICENSE',
    'README.md',
    'icons/*',
    'manifest.json',
    '*.html',
    '*.js',
    '!gulpfile.js',
  ], {base: './'});

  return sources
      .pipe(rename((path) => {
        path.dirname = `eme_logger/${path.dirname}`;
      }))
      .pipe(zip(`eme_logger-${version}.zip`))
      .pipe(gulp.dest('.'));
}

// The default command for this gulpfile is just to package the extension.
exports.default = packageExtension;
