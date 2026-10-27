// Keep CRA's proxy host checks enabled while binding only to loopback.
// CRA 5 passes an undefined allowedHost when HOST is localhost/127.0.0.1.
process.env.NODE_ENV = 'development';
process.env.HOST = '127.0.0.1';
process.env.PORT = '3000';
process.env.BROWSER = 'none';
const dataMode = process.env.BHBC_DATA_MODE || 'production';
if (!['production', 'local'].includes(dataMode)) throw new Error('Unsupported BHBC_DATA_MODE');
process.env.REACT_APP_API_URL = dataMode === 'production' ? 'https://api.bhbc.kr' : 'http://localhost:8080';
console.log(`Local UI data source: ${dataMode === 'production' ? 'LIVE production API (writes affect the website)' : 'local database'}`);
const configPath = require.resolve('react-scripts/config/webpackDevServer.config');
const createConfig = require(configPath);
require.cache[configPath].exports = (proxy, allowedHost) => ({
  ...createConfig(proxy, allowedHost || 'localhost'),
  host: '127.0.0.1',
  allowedHosts: ['localhost', '127.0.0.1'],
});
require('react-scripts/scripts/start');
