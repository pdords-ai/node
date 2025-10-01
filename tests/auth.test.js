const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Authentication API', () => {
  beforeEach(async () => {
    // 테스트 전에 사용자 데이터 정리
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('회원가입이 완료되었습니다.');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined(); // 비밀번호는 응답에 포함되지 않아야 함
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // 첫 번째 사용자 등록
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // 동일한 이메일로 두 번째 등록 시도
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('이미 사용 중인 이메일 또는 사용자명입니다.');
    });

    it('should return error for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('입력 데이터가 올바르지 않습니다.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 테스트용 사용자 생성
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('로그인에 성공했습니다.');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // 테스트용 사용자 생성 및 로그인
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('액세스 토큰이 필요합니다.');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('유효하지 않은 토큰입니다.');
    });
  });
});

