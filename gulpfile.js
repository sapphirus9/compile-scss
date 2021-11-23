/**
 * 設定
 */
const cfg = {
  proxy    : 'localhost',
  host     : '192.168.1.31', // IPアドレス等
  mode     : 'production', // developmentまたはproduction

  rootDir  : '', // 対象のトップディレクトリ
  srcDir   : 'src', // ソースファイルのディレクトリ
  scssDir  : 'scss', // 対象のscssディレクトリ
  scssFiles: '**/*.scss', // 対象のscssファイル
  es6Dir   : 'js', // 対象のes6ディレクトリ
  es6Files : '**/*.js', // 対象のes6ファイル
  tscDir   : 'js', // 対象のtsディレクトリ
  tscFiles : '**/*.ts', // 対象のtsファイル

  distDir  : 'assets', // 出力対象のディレクトリ
  cssDist  : 'css', // cssの出力先ディレクトリ
  cssMap   : '', // css mapの出力先ディレクトリ
  jsDist   : 'js', // es6|tsの出力先ディレクトリ
  jsMap    : '', // js mapの出力先ディレクトリ
}

/**
 * モジュール
 */
const { src, dest, watch, series } = require('gulp')
const babel        = require('gulp-babel')
const sass         = require('gulp-dart-sass')
const notify       = require('gulp-notify')
const plumber      = require('gulp-plumber')
const postcss      = require('gulp-postcss')
const sourcemaps   = require('gulp-sourcemaps')
const typescript   = require('gulp-typescript')
const terser       = require('gulp-terser')
const autoprefixer = require('autoprefixer')
const bsync        = require('browser-sync').create()
const path         = require('path')
const mergerules   = require('postcss-merge-rules')
const normcharset  = require('postcss-normalize-charset')
const smqueries    = require('postcss-sort-media-queries')

/**
 * パス
 */
const _src = {
  scss: path.join(__dirname, cfg.rootDir, cfg.srcDir, cfg.scssDir),
  es6 : path.join(__dirname, cfg.rootDir, cfg.srcDir, cfg.es6Dir),
  tsc : path.join(__dirname, cfg.rootDir, cfg.srcDir, cfg.tscDir),
}
const _files = {
  scss: path.join(_src.scss, cfg.scssFiles),
  es6 : path.join(_src.es6, cfg.es6Files),
  tsc : path.join(_src.tsc, cfg.tscFiles),
}
const _dist = {
  css: path.join(__dirname, cfg.rootDir, cfg.distDir, cfg.cssDist),
  js : path.join(__dirname, cfg.rootDir, cfg.distDir, cfg.jsDist),
}
const _map = {
  scss: `./${path.relative(_dist.css, _src.scss)}`,
  es6 : `./${path.relative(_dist.js, _src.es6)}`,
  tsc : `./${path.relative(_dist.js, _src.tsc)}`,
}
const _reload = [
  path.join(__dirname, cfg.rootDir, '**/*.html'),
  path.join(__dirname, cfg.rootDir, '**/*.php'),
  path.join(_dist.js, '**/*.js'),
]

/**
 * SCSS
 */
// mode: development
const ScssDev = () =>
  src(_files.scss)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(sourcemaps.init())
    .pipe(sass.sync({
      outputStyle: 'expanded',
      indentType: 'space',
      indentWidth: 2,
    }))
    .pipe(postcss([
      autoprefixer({ cascade: false }),
      mergerules(),
      smqueries()
    ]))
    .pipe(sourcemaps.write(cfg.cssMap, {
      includeContent: false,
      sourceRoot: _map.scss,
    }))
    .pipe(dest(_dist.css))
    .pipe(bsync.stream())

// mode: production
const ScssProd = () =>
  src(_files.scss)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(sass.sync({
      outputStyle: 'compressed',
    }))
    .pipe(postcss([
      autoprefixer({ cascade: false }),
      normcharset(),
      mergerules(),
      smqueries()
    ]))
    .pipe(dest(_dist.css))
    .pipe(bsync.stream())

/**
 * Babel
 */
// mode: development
const BabelDev = () =>
  src(_files.es6)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(sourcemaps.init())
    .pipe(babel({ "presets": ["@babel/preset-env"] }))
    .pipe(sourcemaps.write(cfg.jsMap, {
      includeContent: false,
      sourceRoot: _map.es6,
    }))
    .pipe(dest(_dist.js))

// mode: production
const BabelProd = () =>
  src(_files.es6)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(babel({ "presets": ["@babel/preset-env"] }))
    .pipe(terser())
    .pipe(dest(_dist.js))

/**
 * TypeScript
 */
// mode: development
const TscDev = () =>
  src(_files.tsc)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(sourcemaps.init())
    .pipe(typescript()).js
    .pipe(sourcemaps.write(cfg.jsMap, {
      includeContent: false,
      sourceRoot: _map.tsc,
    }))
    .pipe(dest(_dist.js))

// mode: production
const TscProd = () =>
  src(_files.tsc)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(typescript()).js
    .pipe(terser())
    .pipe(dest(_dist.js))

/**
 * リロード
 */
const Reload = done => {
  bsync.reload()
  done()
}

/**
 * ブラウザ同期
 */
const BrowserSync = done => {
  bsync.init({
    host: cfg.host,
    proxy: cfg.proxy,
    open: false,
    online: false,
    notify: true,
    ui: false,
    https: {
      key: '/root/.ssl/_wildcard.d.localhost+7-key.pem',
      cert: '/root/.ssl/_wildcard.d.localhost+7.pem',
    },
  })
  done()
}

/**
 * ウォッチ
 */
const WatchDev = done => {
  watch(_files.scss, ScssDev)
  watch(_files.es6, BabelDev)
  watch(_files.tsc, TscDev)
  watch(_reload, Reload)
  done()
}
const WatchProd = done => {
  watch(_files.scss, ScssProd)
  watch(_files.es6, BabelProd)
  watch(_files.tsc, TscProd)
  watch(_reload, Reload)
  done()
}

/**
 * 実行
 */
exports.default = series(cfg.mode == 'production' ? WatchProd : WatchDev, BrowserSync)
exports.development = series(WatchDev, BrowserSync)
