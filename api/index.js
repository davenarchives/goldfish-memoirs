// Vercel Serverless Function entry point
// This file wraps the Express app from proxy-server for Vercel deployment.
const app = require('../proxy-server/server.js');

module.exports = app;
