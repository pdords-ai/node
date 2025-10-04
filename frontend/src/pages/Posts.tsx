import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Posts: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>게시물</h1>
          <p>게시물을 작성하고 관리하세요</p>
        </div>

        <div className="card">
          <h2>게시물 작성</h2>
          <form>
            <div className="form-group">
              <label>제목</label>
              <input type="text" placeholder="게시물 제목을 입력하세요" />
            </div>
            <div className="form-group">
              <label>내용</label>
              <textarea rows={4} placeholder="게시물 내용을 입력하세요"></textarea>
            </div>
            <div className="form-group">
              <label>카테고리</label>
              <select>
                <option value="general">일반</option>
                <option value="tech">기술</option>
                <option value="lifestyle">라이프스타일</option>
                <option value="travel">여행</option>
                <option value="food">음식</option>
              </select>
            </div>
            <button className="btn">게시물 작성</button>
          </form>
        </div>

        <div className="card">
          <h2>게시물 목록</h2>
          <p>게시물 목록이 여기에 표시됩니다.</p>
          <button className="btn btn-secondary">게시물 목록 불러오기</button>
        </div>
      </div>
    </div>
  );
};

export default Posts;
