module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'vulntest API',
    version: '1.0.0',
    description: 'Simple API with intentionally vulnerable endpoints for scanner validation.'
  },
  servers: [],
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
        parameters: [
          {
            name: 'cmd',
            in: 'query',
            required: false,
            description: 'Command to execute (unsafe)',
            schema: { type: 'string', example: 'whoami' }
          }
        ],
        responses: {
          200: {
            description: 'Public response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'public endpoint' },
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
    },
    '/api/secure': {
      get: {
        summary: 'Secure endpoint',
        security: [
          { bearerAuth: [] }
        ],
        parameters: [
          {
            name: 'cmd',
            in: 'query',
            required: false,
            description: 'Command to execute (unsafe)',
            schema: { type: 'string', example: 'whoami' }
          }
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
                    token: { type: 'string' },
                    cmd: { type: 'string' },
                    stdout: { type: 'string' },
                    stderr: { type: 'string' }
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
    },
    '/api/render': {
      get: {
        summary: 'Unsafe template rendering endpoint',
        parameters: [
          {
            name: 'template',
            in: 'query',
            required: false,
            description: 'EJS template string to render (unsafe)',
            schema: { type: 'string', example: 'hello' }
          },
          {
            name: 'title',
            in: 'query',
            required: false,
            description: 'Title variable for template',
            schema: { type: 'string', example: 'Test' }
          }
        ],
        responses: {
          200: {
            description: 'Rendered template',
            content: {
              'text/html': {
                schema: { type: 'string' }
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
            schema: { type: 'string', example: '1' }
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
    },
    '/api/user/update': {
      post: {
        summary: 'Unsafe user update endpoint',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  role: { type: 'string', example: 'user' },
                  fetchUrl: { type: 'string', example: 'http://example.com' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated user data or fetched URL response',
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    },
    '/eval': {
      get: {
        summary: 'Unsafe eval endpoint (alias)',
        parameters: [
          {
            name: 'expr',
            in: 'query',
            required: false,
            description: 'Expression to evaluate',
            schema: { type: 'string', example: '1' }
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
    '/exec': {
      get: {
        summary: 'Unsafe command execution endpoint (alias)',
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
    },
    '/api/users/search': {
      get: {
        summary: 'Search users (SQL Injection + Reflected XSS)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Search query (vulnerable to SQL injection and XSS)',
            schema: { type: 'string', example: 'admin' }
          }
        ],
        responses: {
          200: {
            description: 'HTML page with search results',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/api/login': {
      post: {
        summary: 'Login endpoint (SQL Injection)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    token: { type: 'string' },
                    user: { type: 'object' }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID (SQL Injection)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID (vulnerable to SQL injection)',
            schema: { type: 'string', example: '1' }
          }
        ],
        responses: {
          200: {
            description: 'User data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    username: { type: 'string' },
                    password: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          },
          404: { description: 'User not found' }
        }
      }
    },
    '/api/products': {
      get: {
        summary: 'Search products (SQL Injection)',
        parameters: [
          {
            name: 'name',
            in: 'query',
            required: false,
            description: 'Product name filter',
            schema: { type: 'string', example: 'Widget' }
          },
          {
            name: 'sort',
            in: 'query',
            required: false,
            description: 'Sort column (vulnerable to SQL injection)',
            schema: { type: 'string', example: 'id' }
          }
        ],
        responses: {
          200: {
            description: 'Product list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      price: { type: 'number' },
                      description: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/search': {
      get: {
        summary: 'Search page (Reflected XSS)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Search query (reflected without sanitization)',
            schema: { type: 'string', example: 'test' }
          }
        ],
        responses: {
          200: {
            description: 'HTML search page',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/error': {
      get: {
        summary: 'Error page (Reflected XSS)',
        parameters: [
          {
            name: 'msg',
            in: 'query',
            required: false,
            description: 'Error message (reflected without sanitization)',
            schema: { type: 'string', example: 'Not found' }
          }
        ],
        responses: {
          400: {
            description: 'Error page',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/profile': {
      get: {
        summary: 'Profile page (Reflected XSS)',
        parameters: [
          {
            name: 'name',
            in: 'query',
            required: false,
            description: 'User name (reflected without sanitization)',
            schema: { type: 'string', example: 'Guest' }
          },
          {
            name: 'bio',
            in: 'query',
            required: false,
            description: 'User bio (reflected without sanitization)',
            schema: { type: 'string', example: 'Hello' }
          }
        ],
        responses: {
          200: {
            description: 'Profile page',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/redirect': {
      get: {
        summary: 'Redirect page (Open Redirect + DOM XSS)',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: false,
            description: 'URL to redirect to (no validation)',
            schema: { type: 'string', example: '/' }
          }
        ],
        responses: {
          200: {
            description: 'Redirect page',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/comments': {
      get: {
        summary: 'Guestbook (Stored XSS)',
        responses: {
          200: {
            description: 'Guestbook page with comments',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      },
      post: {
        summary: 'Post comment (Stored XSS)',
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  author: { type: 'string', example: 'User' },
                  comment: { type: 'string', example: 'Hello' }
                }
              }
            }
          }
        },
        responses: {
          302: { description: 'Redirect to guestbook' }
        }
      }
    },
    '/download': {
      get: {
        summary: 'File download (Path Traversal)',
        parameters: [
          {
            name: 'file',
            in: 'query',
            required: false,
            description: 'Filename to download (no path validation)',
            schema: { type: 'string', example: 'example.txt' }
          }
        ],
        responses: {
          200: { description: 'File contents' }
        }
      }
    },
    '/api/proxy': {
      get: {
        summary: 'Proxy endpoint (SSRF)',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            description: 'URL to fetch (no validation - SSRF)',
            schema: { type: 'string', example: 'http://example.com' }
          }
        ],
        responses: {
          200: { description: 'Proxied response content' },
          400: { description: 'Missing url parameter' }
        }
      }
    },
    '/api/user/profile': {
      get: {
        summary: 'User profile (IDOR + SQL Injection)',
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: false,
            description: 'User ID (no authorization check)',
            schema: { type: 'string', example: '1' }
          }
        ],
        responses: {
          200: {
            description: 'User profile with sensitive data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    username: { type: 'string' },
                    password: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/xml': {
      post: {
        summary: 'XML endpoint (XXE)',
        requestBody: {
          required: true,
          content: {
            'application/xml': {
              schema: { type: 'string', example: '<root><data>test</data></root>' }
            }
          }
        },
        responses: {
          200: {
            description: 'Reflected XML',
            content: { 'application/xml': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/login': {
      get: {
        summary: 'Login page (Open Redirect)',
        parameters: [
          {
            name: 'returnUrl',
            in: 'query',
            required: false,
            description: 'Return URL after login (no validation)',
            schema: { type: 'string', example: '/' }
          }
        ],
        responses: {
          200: {
            description: 'Login form',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/api/template': {
      get: {
        summary: 'Template rendering (SSTI)',
        parameters: [
          {
            name: 'name',
            in: 'query',
            required: false,
            description: 'Name variable',
            schema: { type: 'string', example: 'World' }
          },
          {
            name: 'tpl',
            in: 'query',
            required: false,
            description: 'EJS template string (SSTI)',
            schema: { type: 'string', example: '<h1>Hello</h1>' }
          }
        ],
        responses: {
          200: {
            description: 'Rendered HTML',
            content: { 'text/html': { schema: { type: 'string' } } }
          }
        }
      }
    },
    '/api/upload': {
      post: {
        summary: 'File upload (Unrestricted)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Upload successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    filename: { type: 'string' },
                    path: { type: 'string' },
                    size: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin': {
      get: {
        summary: 'Admin panel (Broken Auth)',
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: false,
            description: 'JWT token (no role verification)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Admin data with all users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    admin: { type: 'boolean' },
                    users: { type: 'array' }
                  }
                }
              }
            }
          },
          401: { description: 'Authentication required' }
        }
      }
    },
    '/api/cors-test': {
      get: {
        summary: 'CORS test (Misconfigured CORS)',
        responses: {
          200: {
            description: 'Response with reflected Origin',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    secret: { type: 'string' }
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
