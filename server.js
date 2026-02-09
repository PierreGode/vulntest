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
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3009;
const expectedToken = process.env.BEARER_TOKEN || 'scanner-test-token';
const JWT_SECRET = 'hardcoded-secret-key-12345';

// Initialize in-memory SQLite database with test data
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT, role TEXT)");
  db.run("INSERT INTO users VALUES (1, 'admin', 'admin123', 'admin@vulntest.local', 'admin')");
  db.run("INSERT INTO users VALUES (2, 'user', 'password', 'user@vulntest.local', 'user')");
  db.run("INSERT INTO users VALUES (3, 'guest', 'guest', 'guest@vulntest.local', 'guest')");
  db.run("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, description TEXT)");
  db.run("INSERT INTO products VALUES (1, 'Widget', 9.99, 'A test widget')");
  db.run("INSERT INTO products VALUES (2, 'Gadget', 19.99, 'A test gadget')");
});

// Unrestricted file upload storage
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
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

// ===== SQL Injection endpoints (ZAP High) =====

// SQL Injection - search users (returns HTML for ZAP XSS + SQLi detection)
app.get('/api/users/search', (req, res) => {
  const query = req.query.q || '';
  const sql = "SELECT * FROM users WHERE username LIKE '%" + query + "%' OR email LIKE '%" + query + "%'";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).send('<html><body><h1>Error</h1><p>' + err.message + '</p></body></html>');
    }
    let html = '<html><body><h1>User Search Results</h1>';
    html += '<p>Search query: ' + query + '</p>';
    html += '<table border="1"><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr>';
    if (rows) {
      rows.forEach(r => {
        html += '<tr><td>' + r.id + '</td><td>' + r.username + '</td><td>' + r.email + '</td><td>' + r.role + '</td></tr>';
      });
    }
    html += '</table></body></html>';
    res.send(html);
  });
});

// SQL Injection - login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, JWT_SECRET);
      res.cookie('session', token, { httpOnly: false });
      return res.json({ message: 'Login successful', token, user: row });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  });
});

// SQL Injection - get user by ID (classic numeric SQLi)
app.get('/api/users/:id', (req, res) => {
  const sql = "SELECT * FROM users WHERE id = " + req.params.id;
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.json(row);
    }
    return res.status(404).json({ error: 'User not found' });
  });
});

// SQL Injection - product search
app.get('/api/products', (req, res) => {
  const category = req.query.name || '';
  const sort = req.query.sort || 'id';
  const sql = "SELECT * FROM products WHERE name LIKE '%" + category + "%' ORDER BY " + sort;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json(rows || []);
  });
});

// ===== Cross-Site Scripting (XSS) endpoints (ZAP High) =====

// Reflected XSS - serves HTML with unsanitized user input
app.get('/search', (req, res) => {
  const q = req.query.q || '';
  res.send(`<html>
<head><title>Search</title></head>
<body>
  <h1>Search Results</h1>
  <form method="GET" action="/search">
    <input type="text" name="q" value="${q}">
    <button type="submit">Search</button>
  </form>
  <p>You searched for: ${q}</p>
  <p>No results found for <b>${q}</b></p>
</body>
</html>`);
});

// Reflected XSS - error page
app.get('/error', (req, res) => {
  const msg = req.query.msg || 'Unknown error';
  res.status(400).send('<html><body><h1>Error</h1><div class="error-message">' + msg + '</div></body></html>');
});

// Reflected XSS - profile page with name reflection
app.get('/profile', (req, res) => {
  const name = req.query.name || 'Guest';
  const bio = req.query.bio || '';
  res.send(`<html>
<head><title>Profile - ${name}</title></head>
<body>
  <h1>Welcome, ${name}!</h1>
  <div class="bio">${bio}</div>
  <a href="/profile?name=${name}">Permalink</a>
</body>
</html>`);
});

// DOM-based XSS - redirect endpoint
app.get('/redirect', (req, res) => {
  const url = req.query.url || '/';
  res.send(`<html>
<head><title>Redirecting...</title></head>
<body>
  <p>Redirecting to: <a href="${url}">${url}</a></p>
  <script>
    var target = "${url}";
    document.write("You will be redirected to: " + target);
    setTimeout(function() { window.location = target; }, 3000);
  </script>
</body>
</html>`);
});

// Stored XSS - comments / guestbook
const comments = [];
app.get('/comments', (req, res) => {
  let html = '<html><head><title>Comments</title></head><body><h1>Guestbook</h1>';
  html += '<form method="POST" action="/comments"><input name="author" placeholder="Name"><br>';
  html += '<textarea name="comment" placeholder="Comment"></textarea><br>';
  html += '<button type="submit">Post</button></form><hr>';
  comments.forEach(c => {
    html += '<div class="comment"><b>' + c.author + '</b>: ' + c.comment + '</div>';
  });
  html += '</body></html>';
  res.send(html);
});
app.post('/comments', (req, res) => {
  comments.push({ author: req.body.author || 'Anonymous', comment: req.body.comment || '' });
  res.redirect('/comments');
});

// ===== Path Traversal serving HTML (ZAP High) =====
app.get('/download', (req, res) => {
  const filename = req.query.file || 'example.txt';
  const filePath = path.join(__dirname, 'data', filename);
  res.sendFile(filePath);
});

// ===== Remote File Inclusion / SSRF (ZAP High) =====
app.get('/api/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' });
  }
  axios.get(url).then(response => {
    res.send(response.data);
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// ===== Insecure Direct Object Reference (ZAP High) =====
app.get('/api/user/profile', (req, res) => {
  const userId = req.query.id || '1';
  const sql = "SELECT * FROM users WHERE id = " + userId;
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.json({ id: row.id, username: row.username, password: row.password, email: row.email, role: row.role });
    }
    return res.status(404).json({ error: 'User not found' });
  });
});

// ===== XML External Entity (XXE) endpoint (ZAP High) =====
app.post('/api/xml', (req, res) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    // Reflect the XML back - vulnerable to XXE
    res.set('Content-Type', 'application/xml');
    res.send(body);
  });
});

// ===== Open Redirect (ZAP High) =====
app.get('/login', (req, res) => {
  const returnUrl = req.query.returnUrl || '/';
  res.send(`<html>
<head><title>Login</title></head>
<body>
  <h1>Login</h1>
  <form method="POST" action="/api/login">
    <input type="text" name="username" placeholder="Username"><br>
    <input type="password" name="password" placeholder="Password"><br>
    <input type="hidden" name="returnUrl" value="${returnUrl}">
    <button type="submit">Login</button>
  </form>
</body>
</html>`);
});

// ===== Server-Side Template Injection returning HTML (ZAP High) =====
app.get('/api/template', (req, res) => {
  const name = req.query.name || 'World';
  const templateStr = req.query.tpl || '<h1>Hello, <%= name %>!</h1>';
  try {
    const result = ejs.render(templateStr, { name: name });
    res.send('<html><body>' + result + '</body></html>');
  } catch (e) {
    res.status(500).send('<html><body><h1>Template Error</h1><pre>' + e.message + '</pre></body></html>');
  }
});

// ===== Unrestricted File Upload (ZAP High) =====
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // No file type validation - accepts any file including executables
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.originalname,
    path: '/uploads/' + req.file.filename,
    size: req.file.size
  });
});

// Serve uploaded files without restriction
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Insecure JWT / Broken Authentication =====
app.get('/api/admin', (req, res) => {
  const token = req.cookies.session || req.query.token || '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // No role check - any valid token gets admin access
    const sql = "SELECT * FROM users";
    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json({ admin: true, users: rows, decoded });
    });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// ===== CORS Misconfiguration =====
app.use('/api/cors-test', (req, res) => {
  // Reflects origin - allows any domain
  res.set('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.json({ message: 'CORS test endpoint', secret: 'sensitive-data-here' });
});

// ===== Directory Listing / Information Disclosure =====
app.use('/static', express.static(__dirname, { dotfiles: 'allow' }));

// ===== Homepage with links for ZAP spidering =====
app.get('/', (req, res) => {
  res.send(`<html>
<head><title>Vulntest Application</title></head>
<body>
<h1>Vulntest - Vulnerable Test Application</h1>
<nav>
  <h2>Pages</h2>
  <ul>
    <li><a href="/search?q=test">Search</a></li>
    <li><a href="/profile?name=Guest">Profile</a></li>
    <li><a href="/comments">Guestbook</a></li>
    <li><a href="/login">Login</a></li>
    <li><a href="/api-docs">API Documentation</a></li>
    <li><a href="/download?file=example.txt">Download</a></li>
    <li><a href="/error?msg=test">Error Page</a></li>
    <li><a href="/redirect?url=/">Redirect</a></li>
  </ul>
  <h2>API Endpoints</h2>
  <ul>
    <li><a href="/api/users/search?q=admin">User Search</a></li>
    <li><a href="/api/users/1">Get User</a></li>
    <li><a href="/api/products?name=Widget">Products</a></li>
    <li><a href="/api/user/profile?id=1">User Profile</a></li>
    <li><a href="/api/proxy?url=http://example.com">Proxy</a></li>
    <li><a href="/api/template?name=World">Template</a></li>
    <li><a href="/api/eval?expr=2+2">Eval</a></li>
    <li><a href="/api/exec?cmd=whoami">Exec</a></li>
    <li><a href="/api/file?path=example.txt">File Read</a></li>
    <li><a href="/api/render?title=Test">Render</a></li>
    <li><a href="/api/admin?token=test">Admin</a></li>
    <li><a href="/api/cors-test">CORS Test</a></li>
    <li><a href="/health">Health</a></li>
  </ul>
</nav>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`vulntest listening on port ${port}`);
});
