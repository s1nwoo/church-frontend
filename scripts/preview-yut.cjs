// Local-only component preview: no credentials, production routes, or remote API calls.
process.env.NODE_ENV = 'development';
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const http = require('http');
const output = path.resolve(__dirname, '../.yut-preview');
webpack({ mode: 'development', devtool: false, entry: path.resolve(__dirname, '../qa/yut-preview.js'),
  output: { path: output, filename: 'preview.js' },
  module: { rules: [
    { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['babel-preset-react-app'] } } },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
  ] },
}, (error, stats) => {
  if (error || stats.hasErrors()) { console.error(error || stats.toString({ all: false, errors: true })); process.exitCode = 1; return; }
  http.createServer((req, res) => {
    if (req.url === '/preview.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); fs.createReadStream(path.join(output, 'preview.js')).pipe(res); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>윷놀이 · 로컬 화면 미리보기</title></head><body><div id="root"></div><script src="/preview.js"></script></body></html>');
  }).listen(3107, '127.0.0.1', () => console.log('Local component preview: http://127.0.0.1:3107'));
});
