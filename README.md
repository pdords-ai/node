# 🚀 Node.js + React + TypeScript 종합 학습 프로젝트

Node.js 백엔드와 React 프론트엔드를 TypeScript로 구현한 종합적인 학습 프로젝트입니다.

## 📚 학습 목표

이 프로젝트를 통해 다음 기술들을 학습할 수 있습니다:

### 백엔드 기술
- **Express.js** - 웹 프레임워크
- **MongoDB + Mongoose** - NoSQL 데이터베이스
- **JWT** - 인증 및 보안
- **Socket.io** - 실시간 통신
- **Multer** - 파일 업로드
- **Joi** - 데이터 유효성 검사
- **Helmet** - 보안 미들웨어
- **CORS** - 크로스 오리진 리소스 공유
- **Rate Limiting** - API 제한

### 프론트엔드 기술
- **React** - 사용자 인터페이스 라이브러리
- **React Router** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **Socket.io Client** - 실시간 통신 클라이언트

### 공통 기술
- **TypeScript** - 타입 안전성을 제공하는 JavaScript 확장
- **Context API** - React 상태 관리
- **Custom Hooks** - 재사용 가능한 로직

## 🛠️ 기술 스택

### 백엔드
- **Node.js** - JavaScript 런타임
- **TypeScript** - 타입 안전성
- **Express.js** - 웹 프레임워크
- **MongoDB** - NoSQL 데이터베이스
- **Mongoose** - MongoDB ODM
- **Socket.io** - 실시간 통신
- **JWT** - 인증 토큰
- **Multer** - 파일 업로드
- **Joi** - 데이터 유효성 검사

### 프론트엔드
- **React** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Socket.io Client** - 실시간 통신
- **Context API** - 상태 관리

### 보안 및 미들웨어
- **Helmet** - 보안 헤더
- **CORS** - 크로스 오리진 설정
- **bcryptjs** - 비밀번호 해싱
- **express-rate-limit** - API 제한

## 📁 프로젝트 구조

```
nodejs-learning-project/
├── server.ts                # 메인 서버 파일 (TypeScript)
├── package.json             # 백엔드 의존성 및 스크립트
├── tsconfig.json            # TypeScript 설정
├── env.example              # 환경 변수 예시
├── types/                   # 타입 정의
│   └── index.ts             # 공통 타입 정의
├── models/                  # 데이터베이스 모델 (TypeScript)
│   ├── User.ts              # 사용자 모델
│   └── Post.ts              # 게시물 모델
├── routes/                  # API 라우트 (TypeScript)
│   ├── auth.ts              # 인증 라우트
│   ├── users.ts             # 사용자 관리
│   ├── posts.ts             # 게시물 관리
│   └── upload.ts            # 파일 업로드
├── middleware/              # 미들웨어 (TypeScript)
│   └── auth.ts              # 인증 미들웨어
├── socket/                  # Socket.io 핸들러
│   └── socketHandler.js     # 실시간 통신
├── uploads/                 # 업로드된 파일 저장소
├── dist/                    # 컴파일된 JavaScript 파일
└── frontend/                # React 프론트엔드
    ├── package.json         # 프론트엔드 의존성
    ├── tsconfig.json        # 프론트엔드 TypeScript 설정
    ├── public/              # 정적 파일
    └── src/                 # 소스 코드
        ├── components/      # React 컴포넌트
        ├── pages/           # 페이지 컴포넌트
        ├── contexts/        # React Context
        ├── services/        # API 서비스
        ├── types/           # 타입 정의
        └── App.tsx          # 메인 앱 컴포넌트
```

## 🚀 시작하기

### 1. 백엔드 의존성 설치

```bash
npm install
```

### 2. 프론트엔드 의존성 설치

```bash
cd frontend
npm install
cd ..
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스 설정
MONGODB_URI=mongodb://localhost:27017/nodejs_learning

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# 이메일 설정 (선택사항)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# 파일 업로드 설정
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 4. MongoDB 실행

MongoDB가 설치되어 있어야 합니다. 로컬에서 실행하거나 MongoDB Atlas를 사용할 수 있습니다.

```bash
# 로컬 MongoDB 실행 (macOS/Linux)
mongod

# 또는 Docker 사용
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. 서버 실행

#### 백엔드 서버 실행

```bash
# 개발 모드 (TypeScript 직접 실행)
npm run dev

# 프로덕션 모드 (컴파일 후 실행)
npm run build
npm start
```

#### 프론트엔드 서버 실행

```bash
cd frontend
npm start
```

- 백엔드 서버: `http://localhost:3000`
- 프론트엔드 서버: `http://localhost:3001`

## 📖 API 문서

### 인증 (Authentication)

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "profile": {
    "firstName": "Test",
    "lastName": "User",
    "bio": "안녕하세요!"
  }
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 현재 사용자 정보
```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### 사용자 관리 (Users)

#### 모든 사용자 조회 (관리자)
```http
GET /api/users?page=1&limit=10&search=test&role=user&isActive=true
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 특정 사용자 조회
```http
GET /api/users/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 프로필 업데이트
```http
PUT /api/users/me
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "profile": {
    "firstName": "Updated",
    "lastName": "Name",
    "bio": "업데이트된 자기소개"
  },
  "username": "newusername"
}
```

### 게시물 관리 (Posts)

#### 게시물 목록 조회
```http
GET /api/posts?page=1&limit=10&category=tech&search=nodejs&sort=newest
```

#### 게시물 생성
```http
POST /api/posts
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Node.js 학습하기",
  "content": "Node.js에 대해 배워보겠습니다.",
  "category": "tech",
  "tags": ["nodejs", "javascript", "backend"]
}
```

#### 게시물 수정
```http
PUT /api/posts/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

#### 좋아요 토글
```http
POST /api/posts/:id/like
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 댓글 추가
```http
POST /api/posts/:id/comments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "좋은 글입니다!"
}
```

### 파일 업로드 (Upload)

#### 단일 파일 업로드
```http
POST /api/upload/single
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

image: [파일]
```

#### 다중 파일 업로드
```http
POST /api/upload/multiple
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

images: [파일1, 파일2, ...]
```

#### 프로필 이미지 업로드
```http
POST /api/upload/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

avatar: [이미지 파일]
```

## 🔌 Socket.io 실시간 통신

### 연결 설정

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### 주요 이벤트

#### 채팅방 참여
```javascript
socket.emit('join_room', 'room123');
```

#### 메시지 전송
```javascript
socket.emit('send_message', {
  roomId: 'room123',
  message: '안녕하세요!',
  type: 'text'
});
```

#### 개인 메시지
```javascript
socket.emit('send_private_message', {
  targetUserId: 'user123',
  message: '개인 메시지입니다.',
  type: 'text'
});
```

#### 타이핑 상태
```javascript
// 타이핑 시작
socket.emit('typing_start', { roomId: 'room123' });

// 타이핑 중지
socket.emit('typing_stop', { roomId: 'room123' });
```

### 이벤트 리스너

```javascript
// 새 메시지 수신
socket.on('new_message', (data) => {
  console.log('새 메시지:', data);
});

// 개인 메시지 수신
socket.on('private_message', (data) => {
  console.log('개인 메시지:', data);
});

// 사용자 온라인/오프라인
socket.on('user_online', (data) => {
  console.log('사용자 온라인:', data);
});

socket.on('user_offline', (data) => {
  console.log('사용자 오프라인:', data);
});

// 알림 수신
socket.on('notification', (data) => {
  console.log('알림:', data);
});
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 📊 데이터베이스 스키마

### User 모델
- `username` - 사용자명 (고유)
- `email` - 이메일 (고유)
- `password` - 해싱된 비밀번호
- `profile` - 프로필 정보 (이름, 아바타, 자기소개)
- `role` - 역할 (user, admin, moderator)
- `isActive` - 계정 활성화 상태
- `lastLogin` - 마지막 로그인 시간

### Post 모델
- `title` - 제목
- `content` - 내용
- `author` - 작성자 (User 참조)
- `category` - 카테고리
- `tags` - 태그 배열
- `images` - 이미지 파일 정보
- `likes` - 좋아요 정보
- `comments` - 댓글 배열
- `isPublished` - 공개 여부
- `viewCount` - 조회수

## 🔒 보안 기능

- **JWT 인증** - 토큰 기반 인증
- **비밀번호 해싱** - bcryptjs 사용
- **Rate Limiting** - API 요청 제한
- **Helmet** - 보안 헤더 설정
- **CORS** - 크로스 오리진 설정
- **입력 검증** - Joi를 사용한 데이터 유효성 검사

## 🚀 배포

### 환경 변수 설정
프로덕션 환경에서는 다음 환경 변수를 설정하세요:

```env
NODE_ENV=production
JWT_SECRET=your_very_secure_secret_key
MONGODB_URI=your_production_mongodb_uri
```

### PM2를 사용한 프로세스 관리
```bash
npm install -g pm2
pm2 start server.js --name "nodejs-learning"
pm2 startup
pm2 save
```

## 📚 학습 가이드

### 1단계: 기본 설정
1. 프로젝트 클론 및 의존성 설치
2. MongoDB 설정
3. 환경 변수 설정
4. 서버 실행 및 테스트

### 2단계: 인증 시스템
1. JWT 토큰 이해
2. 회원가입/로그인 API 테스트
3. 미들웨어 동작 원리 학습

### 3단계: 데이터베이스
1. Mongoose 스키마 설계
2. CRUD 작업 이해
3. 관계형 데이터 처리

### 4단계: RESTful API
1. HTTP 메서드와 상태 코드
2. API 설계 원칙
3. 에러 처리 및 응답 형식

### 5단계: 실시간 통신
1. Socket.io 기본 개념
2. 이벤트 기반 통신
3. 실시간 채팅 구현

### 6단계: 파일 업로드
1. Multer 미들웨어
2. 파일 타입 및 크기 제한
3. 파일 관리 시스템

### 7단계: 보안
1. 인증 및 권한 관리
2. 입력 데이터 검증
3. 보안 헤더 설정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**Happy Coding! 🎉**


