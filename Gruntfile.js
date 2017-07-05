module.exports = function run(grunt) {
  grunt.initConfig({
    eslint: {
      options: {
        useEslintrc: true,
      },
      all: [
        'Gruntfile.js',
        '*.js',
      ],
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.registerTask('default', ['eslint']);
};
