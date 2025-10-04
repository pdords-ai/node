// 필요한 라이브러리들을 가져옵니다
// jwt는 웹사이트에서 사용자를 인증하기 위한 토큰을 만들어주는 도구입니다
import jwt from 'jsonwebtoken';
// User는 사용자 정보를 데이터베이스에서 가져오는 도구입니다
import User, { IUserDocument } from '../models/User';
import { IAuthenticatedRequest, IJWTPayload } from '../types';
import { Response, NextFunction } from 'express';

// 사용자 인증을 확인하는 함수 (미들웨어라고 부릅니다)
// 이 함수는 사용자가 로그인했는지 확인하는 문지기 역할을 합니다
export const authenticateToken = async (
  req: IAuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // 1단계: 사용자가 보낸 요청에서 토큰을 찾습니다
    // authorization은 "인증"이라는 뜻으로, 사용자가 누구인지 알려주는 정보가 들어있습니다
    const authHeader = req.headers['authorization'];
    
    // 토큰은 "Bearer 실제토큰" 형태로 오는데, 여기서 실제 토큰만 분리해냅니다
    // split(' ')는 공백으로 나누어서 배열을 만드는 함수입니다
    // [1]은 배열의 두 번째 값(실제 토큰)을 가져옵니다
    const token = authHeader && authHeader.split(' ')[1];

    // 토큰이 없으면 "로그인이 필요해요!"라고 알려줍니다
    if (!token) {
      res.status(401).json({
        error: '액세스 토큰이 필요합니다.',
        code: 'NO_TOKEN'
      });
      return;
    }

    // 2단계: 토큰이 진짜인지 확인합니다
    // JWT_SECRET은 토큰을 만들 때 사용한 비밀키입니다
    // 이 키로 토큰을 풀어서 사용자 ID를 알아냅니다
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    
    // 3단계: 데이터베이스에서 사용자 정보를 찾습니다
    // findById는 ID로 사용자를 찾는 함수입니다
    // select('-password')는 비밀번호는 빼고 다른 정보만 가져오라는 뜻입니다
    const user = await User.findById(decoded.userId).select('-password');
    
    // 사용자가 데이터베이스에 없으면 "잘못된 토큰이에요!"라고 알려줍니다
    if (!user) {
      res.status(401).json({
        error: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // 4단계: 사용자 계정이 활성화되어 있는지 확인합니다
    // isActive가 false면 계정이 비활성화된 상태입니다
    if (!user.isActive) {
      res.status(401).json({
        error: '비활성화된 계정입니다.',
        code: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    // 5단계: 모든 검증이 끝나면 사용자 정보를 요청에 추가합니다
    // req.user에 사용자 정보를 저장해서 다른 곳에서 사용할 수 있게 합니다
    req.user = user;
    
    // next()는 "다음 단계로 넘어가세요"라는 뜻입니다
    next();
    
  } catch (error: any) {
    // 만약 에러가 발생하면 어떤 종류의 에러인지 확인합니다
    
    // JsonWebTokenError: 토큰 자체가 잘못된 형태일 때
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
      return;
    }
    
    // TokenExpiredError: 토큰이 만료되었을 때 (시간이 지나서 더 이상 사용할 수 없을 때)
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: '토큰이 만료되었습니다.',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    // 그 외의 에러들은 서버에 기록하고 "서버 오류"라고 알려줍니다
    console.error('인증 에러:', error);
    res.status(500).json({
      error: '인증 처리 중 오류가 발생했습니다.',
      code: 'AUTH_ERROR'
    });
  }
};

// 관리자 권한을 확인하는 함수
// 이 함수는 "관리자만 들어올 수 있어요!"라고 확인하는 문지기입니다
export const requireAdmin = (
  req: IAuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  // req.user.role은 사용자의 역할을 나타냅니다 (admin, user, moderator 등)
  // 만약 사용자가 관리자(admin)가 아니라면
  if (req.user?.role !== 'admin') {
    // "관리자만 들어올 수 있어요!"라고 알려주고 요청을 거부합니다
    res.status(403).json({
      error: '관리자 권한이 필요합니다.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }
  // 관리자라면 "통과하세요!"라고 하며 다음 단계로 보냅니다
  next();
};

// 중재자 또는 관리자 권한을 확인하는 함수
// 중재자는 관리자보다는 권한이 적지만 일반 사용자보다는 많은 권한을 가집니다
export const requireModerator = (
  req: IAuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  // includes 함수는 배열 안에 해당 값이 있는지 확인합니다
  // ['admin', 'moderator'] 배열에 사용자의 역할이 포함되어 있는지 확인합니다
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    // 관리자나 중재자가 아니라면 "권한이 없어요!"라고 알려줍니다
    res.status(403).json({
      error: '중재자 또는 관리자 권한이 필요합니다.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
    return;
  }
  // 관리자나 중재자라면 통과시킵니다
  next();
};

// 선택적 인증 함수 (토큰이 있으면 확인하고, 없어도 통과시킵니다)
// 이 함수는 "토큰이 있으면 누구인지 확인하고, 없어도 괜찮아요"라고 하는 문지기입니다
export const optionalAuth = async (
  req: IAuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // 1단계: 요청에서 토큰을 찾습니다
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2단계: 토큰이 있다면 검증해봅니다
    if (token) {
      // 토큰을 풀어서 사용자 ID를 알아냅니다
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
      // 데이터베이스에서 사용자 정보를 찾습니다
      const user = await User.findById(decoded.userId).select('-password');
      
      // 사용자가 존재하고 활성화되어 있다면 요청에 사용자 정보를 추가합니다
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    // 토큰이 없거나 유효하지 않아도 계속 진행합니다
    // (선택적 인증이기 때문입니다)
    next();
    
  } catch (error) {
    // 에러가 발생해도 계속 진행합니다 (토큰이 유효하지 않아도 괜찮기 때문)
    next();
  }
};

// 리소스 소유자를 확인하는 함수
// 이 함수는 "이 글을 쓴 사람만 수정할 수 있어요!"라고 확인하는 문지기입니다
export const requireOwnership = (resourceField: string = 'author') => {
  // 이 함수는 함수를 반환합니다 (고급 프로그래밍 기법입니다)
  // resourceField는 기본값으로 'author'를 사용합니다
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
    // 1단계: 리소스(글, 댓글 등)를 찾습니다
    // req[resourceField]는 요청 객체에서 해당 필드를 찾는 것입니다
    // req.body[resourceField]는 요청 본문에서 찾는 것입니다
    // req.params[resourceField]는 URL 파라미터에서 찾는 것입니다
    const resource = (req as any)[resourceField] || req.body[resourceField] || req.params[resourceField];
    
    // 리소스를 찾을 수 없다면 "찾는 리소스가 없어요!"라고 알려줍니다
    if (!resource) {
      res.status(400).json({
        error: '리소스를 찾을 수 없습니다.',
        code: 'RESOURCE_NOT_FOUND'
      });
      return;
    }

    // 2단계: 관리자는 모든 리소스에 접근할 수 있습니다
    // 관리자는 특별한 권한을 가지고 있어서 다른 사람의 글도 수정할 수 있습니다
    if (req.user?.role === 'admin') {
      return next(); // 관리자라면 바로 통과시킵니다
    }

    // 3단계: 리소스의 소유자가 맞는지 확인합니다
    // resource._id는 리소스의 ID이고, resource 자체가 ID일 수도 있습니다
    const resourceId = resource._id || resource;
    // req.user._id는 현재 로그인한 사용자의 ID입니다
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        error: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    // toString()은 ID를 문자열로 바꿔주는 함수입니다
    // 두 ID가 같지 않다면 "이 글의 주인이 아니에요!"라고 알려줍니다
    if (resourceId.toString() !== userId.toString()) {
      res.status(403).json({
        error: '이 리소스에 대한 권한이 없습니다.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // 소유자가 맞다면 통과시킵니다
    next();
  };
};

// 이 파일에서 만든 모든 함수들을 다른 파일에서 사용할 수 있게 내보냅니다
// export는 "이 함수들을 다른 곳에서 사용할 수 있게 해주세요"라는 뜻입니다
export default {
  authenticateToken,    // 사용자 인증을 확인하는 함수
  requireAdmin,        // 관리자 권한을 확인하는 함수
  requireModerator,    // 중재자 권한을 확인하는 함수
  optionalAuth,        // 선택적 인증을 처리하는 함수
  requireOwnership     // 리소스 소유자를 확인하는 함수
};
