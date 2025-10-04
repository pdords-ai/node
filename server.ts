// 필요한 라이브러리들을 가져옵니다
// express는 웹 서버를 만드는 도구입니다 (마치 레스토랑을 만드는 것과 같아요)
import express, { Application, Request, Response, NextFunction } from 'express';
// mongoose는 MongoDB 데이터베이스와 연결하는 도구입니다 (마치 도서관 사서와 같아요)
import mongoose from 'mongoose';
// cors는 다른 웹사이트에서 우리 서버에 접근할 수 있게 해주는 도구입니다
import cors from 'cors';
// helmet은 웹사이트를 해커로부터 보호하는 보안 도구입니다 (마치 헬멧과 같아요)
import helmet from 'helmet';
// rateLimit은 너무 많은 요청이 오는 것을 막는 도구입니다 (마치 문지기와 같아요)
import rateLimit from 'express-rate-limit';
// dotenv는 환경 변수(.env 파일)를 읽어오는 도구입니다
import dotenv from 'dotenv';
// Socket.io는 실시간 통신을 위한 도구입니다
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { IApiResponse, IEnvironment } from './types';

// 환경 변수 로드
dotenv.config();

// Express 앱을 만듭니다 (우리 웹사이트의 기본 틀을 만드는 것입니다)
const app: Application = express();
// 서버가 실행될 포트 번호를 정합니다 (3000번이 기본값이에요)
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// HTTP 서버 생성 (Socket.io를 위해 필요)
const server = createServer(app);

// 미들웨어 설정 (모든 요청이 지나가기 전에 실행되는 기능들)
// app.use는 "모든 요청에 대해 이 기능을 사용하세요"라는 뜻입니다

// helmet(): 웹사이트를 해커로부터 보호하는 보안 헤더를 설정합니다
// 마치 문에 보안 시스템을 설치하는 것과 같아요
app.use(helmet());

// cors(): 다른 웹사이트에서 우리 서버에 접근할 수 있게 해줍니다
// 마치 다른 나라 사람도 우리 집에 올 수 있게 허가하는 것과 같아요
app.use(cors());

// express.json(): 사용자가 보낸 JSON 데이터를 읽을 수 있게 해줍니다
// limit: '10mb'는 최대 10MB까지 받을 수 있다는 뜻입니다
// 마치 편지를 읽을 수 있게 해주는 것과 같아요
app.use(express.json({ limit: '10mb' }));

// express.urlencoded(): 웹 폼에서 보낸 데이터를 읽을 수 있게 해줍니다
// extended: true는 복잡한 데이터도 받을 수 있다는 뜻입니다
app.use(express.urlencoded({ extended: true }));

// Rate limiting 설정 (요청 제한 설정)
// 이 설정은 "너무 많은 요청을 보내면 잠시 기다리세요"라고 하는 문지기입니다
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분 (15 * 60 * 1000 밀리초)
  max: 100, // 최대 100번의 요청만 허용
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});
// '/api/'로 시작하는 모든 요청에 이 제한을 적용합니다
app.use('/api/', limiter);

// 정적 파일 서빙 (이미지나 파일을 웹에서 볼 수 있게 해줍니다)
// '/uploads' 경로로 오는 요청은 'uploads' 폴더에서 파일을 찾아서 보여줍니다
// 마치 파일 보관함을 웹에서 접근할 수 있게 해주는 것과 같아요
app.use('/uploads', express.static('uploads'));

// MongoDB 연결 (데이터베이스에 연결합니다)
// MongoDB는 데이터를 저장하는 곳입니다 (마치 거대한 서류함과 같아요)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nodejs_learning', {
  // useNewUrlParser: true,      // 새로운 URL 파서를 사용합니다 (Mongoose 6+에서는 기본값)
  // useUnifiedTopology: true,   // 통합된 토폴로지를 사용합니다 (Mongoose 6+에서는 기본값)
})
// 연결이 성공하면 이 메시지를 출력합니다
.then(() => console.log('✅ MongoDB 연결 성공'))
// 연결이 실패하면 에러 메시지를 출력합니다
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 라우트 설정 (URL 경로에 따라 다른 기능을 실행하도록 설정합니다)
// 마치 건물에서 방 번호에 따라 다른 방으로 안내하는 것과 같아요

// '/api/auth'로 오는 요청은 ./routes/auth 파일의 기능을 사용합니다
// (로그인, 회원가입 등 인증 관련 기능)
app.use('/api/auth', require('./routes/auth'));

// '/api/users'로 오는 요청은 ./routes/users 파일의 기능을 사용합니다
// (사용자 정보 조회, 수정 등 사용자 관련 기능)
app.use('/api/users', require('./routes/users'));

// '/api/posts'로 오는 요청은 ./routes/posts 파일의 기능을 사용합니다
// (게시글 작성, 조회, 수정, 삭제 등 게시글 관련 기능)
app.use('/api/posts', require('./routes/posts'));

// '/api/upload'로 오는 요청은 ./routes/upload 파일의 기능을 사용합니다
// (파일 업로드 관련 기능)
app.use('/api/upload', require('./routes/upload'));

// 기본 라우트 (홈페이지에 접속했을 때 보여줄 내용)
// '/'는 웹사이트의 메인 주소를 의미합니다 (예: www.example.com)
app.get('/', (req: Request, res: Response): void => {
  // JSON 형태로 환영 메시지와 사용 가능한 API 목록을 보여줍니다
  const response: IApiResponse<{
    message: string;
    version: string;
    endpoints: {
      auth: string;
      users: string;
      posts: string;
      upload: string;
    };
  }> = {
    success: true,
    message: 'Node.js 학습 프로젝트에 오신 것을 환영합니다! 🚀',
    data: {
      message: 'Node.js 학습 프로젝트에 오신 것을 환영합니다! 🚀',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',      // 인증 관련 API
        users: '/api/users',    // 사용자 관련 API
        posts: '/api/posts',    // 게시글 관련 API
        upload: '/api/upload'   // 파일 업로드 API
      }
    }
  };
  res.json(response);
});

// 404 에러 핸들러 (존재하지 않는 페이지에 접속했을 때)
// '*'는 "모든 경로"를 의미합니다
app.use('*', (req: Request, res: Response): void => {
  // 404 상태 코드와 함께 에러 메시지를 보여줍니다
  const response: IApiResponse = {
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    code: 'NOT_FOUND'
  };
  res.status(404).json(response);
});

// 전역 에러 핸들러 (서버에서 에러가 발생했을 때)
// 이 함수는 다른 모든 에러 처리 함수들보다 나중에 실행됩니다
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  // 에러를 콘솔에 기록합니다 (개발자가 확인할 수 있게)
  console.error('에러 발생:', err);
  
  // 에러 응답을 보내줍니다
  const response: IApiResponse = {
    success: false,
    // 운영 환경에서는 일반적인 에러 메시지만 보여주고,
    // 개발 환경에서는 자세한 에러 메시지를 보여줍니다
    error: process.env.NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : err.message,
    code: 'INTERNAL_SERVER_ERROR'
  };
  
  res.status(500).json(response);
});

// Socket.io 설정 (실시간 통신을 위한 기능)
// Socket.io는 웹사이트에서 실시간으로 메시지를 주고받을 수 있게 해줍니다
// 마치 채팅이나 실시간 알림 같은 기능을 만들 때 사용해요
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",                    // 모든 도메인에서 접근 허용
    methods: ["GET", "POST"]        // GET과 POST 요청만 허용
  }
});

// Socket.io 이벤트 처리 (실시간 통신 관련 기능들을 처리합니다)
// socketHandler.js 파일에서 실시간 통신 관련 기능들을 가져옵니다
require('./socket/socketHandler')(io);

// 서버 시작 (실제로 웹사이트를 실행합니다)
server.listen(PORT, () => {
  // 서버가 성공적으로 시작되면 이 메시지들을 출력합니다
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📖 API 문서: http://localhost:${PORT}`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
});

// 이 앱을 다른 파일에서도 사용할 수 있게 내보냅니다
export default app;
