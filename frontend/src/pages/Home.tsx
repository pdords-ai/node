import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="hero">
        <h1>Node.js 학습 프로젝트</h1>
        <p>Express.js, MongoDB, JWT, Socket.io를 활용한 종합 학습 예제</p>
        
        <div className="hero-buttons">
          {user ? (
            <>
              <Link to="/dashboard" className="btn">
                대시보드로 이동
              </Link>
              <Link to="/posts" className="btn btn-secondary">
                게시물 보기
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn">
                회원가입
              </Link>
              <Link to="/login" className="btn btn-secondary">
                로그인
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>🔐 인증 시스템</h3>
          <p>
            JWT 토큰 기반의 안전한 사용자 인증 시스템을 구현했습니다. 
            회원가입, 로그인, 비밀번호 변경 등의 기능을 제공합니다.
          </p>
        </div>

        <div className="feature-card">
          <h3>📝 게시물 관리</h3>
          <p>
            CRUD 기능을 갖춘 게시물 시스템입니다. 
            카테고리, 태그, 좋아요, 댓글 등의 기능을 포함합니다.
          </p>
        </div>

        <div className="feature-card">
          <h3>💬 실시간 채팅</h3>
          <p>
            Socket.io를 활용한 실시간 채팅 시스템입니다. 
            방별 채팅, 개인 메시지, 타이핑 상태 등을 지원합니다.
          </p>
        </div>

        <div className="feature-card">
          <h3>📁 파일 업로드</h3>
          <p>
            Multer를 사용한 파일 업로드 시스템입니다. 
            이미지 파일 업로드 및 관리 기능을 제공합니다.
          </p>
        </div>

        <div className="feature-card">
          <h3>🛡️ 보안 기능</h3>
          <p>
            Helmet, CORS, Rate Limiting 등 다양한 보안 기능을 적용했습니다. 
            안전한 웹 애플리케이션을 위한 모범 사례를 학습할 수 있습니다.
          </p>
        </div>

        <div className="feature-card">
          <h3>📊 TypeScript</h3>
          <p>
            TypeScript를 사용하여 타입 안전성을 보장합니다. 
            개발 생산성과 코드 품질을 향상시킬 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
