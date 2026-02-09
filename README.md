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

For Ragnar just zap api scan with GET on http://localhost:3009

The server listens on `http://localhost:3009` by default.

## OpenAPI / Swagger
The API exposes a Swagger UI and raw OpenAPI spec for scanners to import all endpoints before scanning:
- Swagger UI: `http://localhost:3009/api-docs`
- OpenAPI JSON: `http://localhost:3009/openapi.json`

## Endpoints
- `GET /health` - basic health check
- `GET /api/public` - no auth required
- `GET /api/secure` - requires `Authorization: Bearer <token>`
- `GET /api/eval?expr=2+2` - intentionally unsafe eval (critical)
- `GET /api/file?path=example.txt` - intentionally unsafe file read (path traversal)
- `GET /api/exec?cmd=whoami` - intentionally unsafe command execution (critical)

## Auth token
Set `BEARER_TOKEN` to define the expected token.

Example:
```bash
BEARER_TOKEN=scanner-test-token npm start
```

Test with curl:
```bash
curl -i http://localhost:3009/api/secure
curl -i -H "Authorization: Bearer scanner-test-token" http://localhost:3009/api/secure
```

## Cleanup / Remove
To remove installed packages:
```bash
npm run clean
```

To fully remove the app, delete the project directory.
