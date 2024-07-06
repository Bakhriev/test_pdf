'use strict';

const { src, dest, series, parallel, watch } = require('gulp');

const htmlmin = require('gulp-htmlmin');
const fileinclude = require('gulp-file-include');

const sass = require('gulp-sass')(require('node-sass'));
const cssbeautify = require('gulp-cssbeautify');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');

const uglify = require('gulp-uglify');

const svgSprite = require('gulp-svg-sprite');

const flatten = require('gulp-flatten');

const notify = require('gulp-notify');
const del = require('del');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();

const srcPath = 'src/';
const distPath = 'dist/';

const path = {
	build: {
		html: distPath,
		css: distPath + 'assets/css',
		js: distPath + 'assets/js',
		img: distPath + 'assets/img',
		svg: distPath + 'assets/img/svg',
		video: distPath + 'assets/video',
		fonts: distPath + 'assets/fonts',
		vendors: distPath + 'assets/vendors',
		public: distPath,
	},

	src: {
		html: srcPath + '*.html',
		css: srcPath + 'assets/scss/**/*.{scss,css}',
		js: srcPath + 'assets/js/**/*.js',
		img: srcPath + 'assets/**/*.{jpg,jpeg,png,webp,avif}',
		svg: srcPath + 'assets/**/*.svg',
		video: srcPath + 'assets/video/**/*',
		fonts: srcPath + 'assets/fonts/**/*',
		vendors: srcPath + 'assets/vendors/**/*.{css,js}',
		public: srcPath + 'public/**/*',
	},

	clean: distPath,
};

let isProd = false;

function html() {
	return src(path.src.html)
		.pipe(
			fileinclude({
				prefix: '@',
				basepath: '@file',
			})
		)
		.pipe(dest(path.build.html))
		.pipe(browserSync.reload({ stream: true }));
}

function css() {
	return src(path.src.css)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'SCSS Error',
						message: 'Error: <%= error.message %>',
					})(err);
					this.emit('end');
				},
			})
		)
		.pipe(sass())
		.pipe(gcmq())
		.pipe(
			autoprefixer({
				cascade: false,
			})
		)
		.pipe(cssbeautify())
		.pipe(dest(path.build.css))
		.pipe(browserSync.reload({ stream: true }));
}

function js() {
	return src(path.src.js)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'JS Error',
						message: 'Error: <%= error.message %>',
					})(err);
					this.emit('end');
				},
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browserSync.reload({ stream: true }));
}

function img() {
	return src(path.src.img).pipe(flatten()).pipe(dest(path.build.img));
}

function video() {
	return src(path.src.video).pipe(dest(path.build.video));
}

function svgToSprite() {
	return src(path.src.svg)
		.pipe(flatten())
		.pipe(
			svgSprite({
				mode: {
					symbol: {
						sprite: '../sprite.svg',
					},
				},
			})
		)
		.pipe(dest(path.build.svg))
		.pipe(browserSync.reload({ stream: true }));
}

function svgNormal() {
	return src(path.src.svg)
		.pipe(flatten())
		.pipe(dest(path.build.svg))
		.pipe(browserSync.reload({ stream: true }));
}

function vendors() {
	return src(path.src.vendors)
		.pipe(dest(path.build.vendors))
		.pipe(browserSync.reload({ stream: true }));
}

function fonts() {
	return src(path.src.fonts)
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.reload({ stream: true }));
}

// Minify
function htmlMin() {
	return src(path.src.html)
		.pipe(
			fileinclude({
				prefix: '@',
				basepath: '@file',
			})
		)
		.pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
		.pipe(dest(path.build.html));
}

function cssMin() {
	return src(path.src.css)
		.pipe(sass())
		.pipe(gcmq())
		.pipe(
			autoprefixer({
				cascade: false,
			})
		)
		.pipe(cleanCSS({ level: 2 }))
		.pipe(dest(path.build.css));
}

function jsMin() {
	return src(path.src.js).pipe(uglify()).pipe(dest(path.build.js));
}

function publicTask() {
	return src(path.src.public).pipe(dest(path.build.public));
}

function clean() {
	return del(path.clean);
}

function serve() {
	browserSync.init({
		server: {
			baseDir: distPath,
		},
	});
}

function prod(done) {
	!isProd;
	done();
}

const dev = series(
	clean,
	parallel(
		html,
		css,
		js,
		img,
		video,
		svgToSprite,
		svgNormal,
		vendors,
		fonts,
		publicTask
	),
	serve
);

const build = series(
	clean,
	parallel(
		htmlMin,
		cssMin,
		jsMin,
		img,
		video,
		svgToSprite,
		svgNormal,
		vendors,
		fonts,
		publicTask
	)
);

const preview = series(serve);

function watchFiles() {
	watch([path.src.html], html);
	watch([srcPath + '**/*.html'], html);
	watch([srcPath + 'assets/components/**/*.scss'], css);
	watch([path.src.css], css);
	watch([path.src.js], js);
	watch([srcPath + 'assets/js/**/*.js'], js);
	watch([srcPath + 'assets/**/*.js'], js);
	watch([path.src.img], img);
	watch([srcPath + 'assets/components/**/*.svg'], svgToSprite);
	watch([path.src.video], video);
	watch([path.src.svg], svgToSprite);
	watch([path.src.svg], svgNormal);
	watch([path.src.vendors], vendors);
	watch([path.src.fonts], fonts);
	watch([path.src.public], publicTask);
}

const runParallel = parallel(dev, watchFiles);

exports.html = html;
exports.htmlMin = htmlMin;
exports.css = css;
exports.cssMin = cssMin;
exports.js = js;
exports.jsMin = jsMin;
exports.img = img;
exports.video = video;
exports.svgToSprite = svgToSprite;
exports.svgNormal = svgNormal;
exports.dev = dev;
exports.build = build;
exports.vendors = vendors;
exports.fonts = fonts;
exports.publicTask = publicTask;
exports.preview = preview;
exports.watchFiles = watchFiles;

exports.default = runParallel;
