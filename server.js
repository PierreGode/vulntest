const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const _ = require('lodash');
const morgan = require('morgan');
const path = require('path');
const { exec } = require('child_process');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi');

const app = express();
const port = process.env.PORT || 3009;
const expectedToken = process.env.BEARER_TOKEN || 'scanner-test-token';

app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.get('/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/public', (req, res) => {
  const cmd = req.query.cmd;

  if (cmd) {
    return exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: err.message, stderr });
      }

      return res.json({ message: 'public endpoint', cmd, stdout, stderr });
    });
  }

  return res.json({ message: 'public endpoint' });
});

app.get('/api/secure', (req, res) => {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cmd = req.query.cmd;

  if (cmd) {
    return exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: err.message, stderr });
      }

      return res.json({ message: 'secure endpoint', token, cmd, stdout, stderr });
    });
  }

  return res.json({ message: 'secure endpoint', token });
});

// Intentionally vulnerable endpoints for scanner validation
app.get('/api/eval', (req, res) => {
  const expr = req.query.expr || '2 + 2';
  const result = eval(expr);
  res.json({ expr, result });
});

app.get('/eval', (req, res) => {
  const expr = req.query.expr || '2 + 2';
  const result = eval(expr);
  res.json({ expr, result });
});

app.get('/api/file', (req, res) => {
  const baseDir = path.join(__dirname, 'data');
  const requestedPath = req.query.path || 'example.txt';
  const filePath = path.join(baseDir, requestedPath);

  fs.readFile(filePath, 'utf8', (err, contents) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    return res.json({ path: requestedPath, contents });
  });
});

app.get('/api/exec', (req, res) => {
  const cmd = req.query.cmd || 'whoami';

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: err.message, stderr });
    }

    return res.json({ cmd, stdout, stderr });
  });
});

// Vulnerable endpoint with multiple issues
app.post('/api/user/update', (req, res) => {
  // Prototype pollution via lodash
  const userData = _.merge({}, req.body);

  // SSRF via axios with user input
  if (req.body.fetchUrl) {
    return axios.get(req.body.fetchUrl).then((response) => res.json(response.data));
  }

  return res.json(userData);
});

app.get('/exec', (req, res) => {
  const cmd = req.query.cmd || 'whoami';

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: err.message, stderr });
    }

    return res.json({ cmd, stdout, stderr });
  });
});

app.listen(port, () => {
  console.log(`vulntest listening on port ${port}`);
});
