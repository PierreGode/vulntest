# vulntest

Simple Node/Express API with a Bearer-token-protected endpoint for scanner validation.

## Requirements
- Node.js >= 10
- npm 6.x (older lockfile format for scanner testing)

## Install
```bash
npm install
```

## Run
```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## Endpoints
- `GET /health` - basic health check
- `GET /api/public` - no auth required
- `GET /api/secure` - requires `Authorization: Bearer <token>`

## Auth token
Set `BEARER_TOKEN` to define the expected token.

Example:
```bash
BEARER_TOKEN=scanner-test-token npm start
```

Test with curl:
```bash
curl -i http://localhost:3000/api/secure
curl -i -H "Authorization: Bearer scanner-test-token" http://localhost:3000/api/secure
```

## Cleanup / Remove
To remove installed packages:
```bash
npm run clean
```

To fully remove the app, delete the project directory.
