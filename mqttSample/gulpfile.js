var gulp = require('gulp');
var serve = require('gulp-serve');

gulp.task('serve', serve('.'));

gulp.task('default', ['serve']);