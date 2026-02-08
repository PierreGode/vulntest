module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'vulntest API',
    version: '1.0.0',
    description: 'Simple API with intentionally vulnerable endpoints for scanner validation.'
  },
  servers: [
    {
      url: 'http://localhost:3009'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'token'
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/public': {
      get: {
        summary: 'Public endpoint',
        responses: {
          200: {
            description: 'Public response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'public endpoint' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/secure': {
      get: {
        summary: 'Secure endpoint',
        security: [
          { bearerAuth: [] }
        ],
        responses: {
          200: {
            description: 'Secure response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'secure endpoint' },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/eval': {
      get: {
        summary: 'Unsafe eval endpoint',
        parameters: [
          {
            name: 'expr',
            in: 'query',
            required: false,
            description: 'Expression to evaluate',
            schema: { type: 'string', example: '2 + 2' }
          }
        ],
        responses: {
          200: {
            description: 'Eval response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    expr: { type: 'string' },
                    result: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/file': {
      get: {
        summary: 'Unsafe file read endpoint',
        parameters: [
          {
            name: 'path',
            in: 'query',
            required: false,
            description: 'Relative file path to read',
            schema: { type: 'string', example: 'example.txt' }
          }
        ],
        responses: {
          200: {
            description: 'File read response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string' },
                    contents: { type: 'string' }
                  }
                }
              }
            }
          },
          500: {
            description: 'File read error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/exec': {
      get: {
        summary: 'Unsafe command execution endpoint',
        parameters: [
          {
            name: 'cmd',
            in: 'query',
            required: false,
            description: 'Command to execute',
            schema: { type: 'string', example: 'whoami' }
          }
        ],
        responses: {
          200: {
            description: 'Command execution response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cmd: { type: 'string' },
                    stdout: { type: 'string' },
                    stderr: { type: 'string' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Command execution error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    stderr: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
