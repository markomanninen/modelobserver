var gulp = require('gulp');
var uglify = require('gulp-uglifyjs');
 
gulp.task('uglify', function() {
  gulp.src(['./src/elonmedia/modelobserver/js/*.js'])
    .pipe(uglify('modelobserver.min.js', {
      mangle: true,
      output: {
        beautify: false
      }
    }))
    .pipe(gulp.dest('./dist'))
});