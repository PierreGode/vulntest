const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const _ = require('lodash');
const morgan = require('morgan');
const forge = require('node-forge');
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

// Vulnerable hashing middleware – node-forge 0.9.0 has multiple critical CVEs
app.use((req, res, next) => {
  const md = forge.md.md5.create();
  md.update(req.path);
  res.set('X-Request-Hash', md.digest().toHex());
  next();
});

app.get('/openapi.json', (req, res) => {
  const spec = Object.assign({}, openapiSpec, {
    servers: [{ url: req.protocol + '://' + req.get('host') }]
  });
  res.json(spec);
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

// Vulnerable template rendering – ejs 2.7.4 has critical RCE (CVE-2022-29078)
app.get('/api/render', (req, res) => {
  const template = req.query.template || '<h1><%= title %></h1>';
  const result = ejs.render(template, { title: req.query.title || 'Test' });
  res.send(result);
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
