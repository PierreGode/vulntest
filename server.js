const express = require('express');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3009;
const expectedToken = process.env.BEARER_TOKEN || 'scanner-test-token';

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/public', (req, res) => {
  res.json({ message: 'public endpoint' });
});

app.get('/api/secure', (req, res) => {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({ message: 'secure endpoint', token: token });
});

app.listen(port, () => {
  console.log(`vulntest listening on port ${port}`);
});
