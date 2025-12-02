const request = require('supertest');
const app = require('../src/app');

describe('API Health Check', () => {
  test('GET /api/health should return OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET / should return API info', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Manga/Novel Recommendation API');
    expect(response.body.version).toBe('1.0.0');
  });

  test('GET /unknown should return 404', async () => {
    const response = await request(app).get('/unknown');
    expect(response.status).toBe(404);
  });
});

describe('Validation Middleware', () => {
  test('Invalid UUID should return 400', async () => {
    const response = await request(app).get('/api/books/invalid-uuid');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid ID');
  });
});
