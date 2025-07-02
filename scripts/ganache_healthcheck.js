#!/usr/bin/env node
const http = require('http');
const options = {
  host: 'localhost',
  port: 8545,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};
const req = http.request(options, res => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.write('{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}');
req.end();

