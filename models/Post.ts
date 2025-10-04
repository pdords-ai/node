// 필요한 라이브러리를 가져옵니다
import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPost, IComment, IUser } from '../types';

// 게시물 이미지 인터페이스
export interface IPostImage {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

// 게시물 좋아요 인터페이스
export interface IPostLike {
  user: string | IUser; // 사용자 ID 또는 사용자 객체
  likedAt: Date;
}

// 게시물 댓글 인터페이스 (확장)
export interface IPostComment extends IComment {
  author: string | IUser; // 사용자 ID 또는 사용자 객체
  post: string; // 게시물 ID
}

// 게시물 문서 인터페이스 (MongoDB 문서와 TypeScript 타입을 연결)
export interface IPostDocument extends Omit<IPost, '_id' | 'author' | 'comments' | 'likes'>, Document {
  _id: string;
  author: string | IUser;
  comments: IPostComment[];
  likes: IPostLike[];
  images: IPostImage[];
  slug: string;
  
  // 가상 필드들
  likesCount: number;
  commentsCount: number;
  
  // 인스턴스 메서드들
  incrementViewCount(): Promise<IPostDocument>;
  toggleLike(userId: string): { liked: boolean; likesCount: number };
}

// 게시물 모델 인터페이스 (정적 메서드들을 위한)
export interface IPostModel extends Model<IPostDocument> {
  getPopularPosts(limit?: number): Promise<IPostDocument[]>;
  getPostsByCategory(category: string, page?: number, limit?: number): Promise<IPostDocument[]>;
}

// 게시글 정보를 저장할 스키마(틀)를 만듭니다
// 게시글은 마치 블로그 포스트나 SNS 게시물과 같아요
const postSchema = new Schema<IPostDocument>({
  // 게시글 제목
  title: {
    type: String,                    // 문자열 타입
    required: [true, '제목은 필수입니다.'],  // 반드시 입력해야 함
    trim: true,                      // 앞뒤 공백 제거
    maxlength: [200, '제목은 최대 200자까지 가능합니다.']  // 최대 200글자
  },
  
  // 게시글 내용
  content: {
    type: String,                    // 문자열 타입
    required: [true, '내용은 필수입니다.'],  // 반드시 입력해야 함
    maxlength: [5000, '내용은 최대 5000자까지 가능합니다.']  // 최대 5000글자
  },
  
  // 게시글 작성자 (누가 썼는지)
  author: {
    type: Schema.Types.ObjectId,     // 사용자의 ID (ObjectId는 MongoDB의 고유 ID 타입)
    ref: 'User',                     // User 모델을 참조한다는 뜻
    required: [true, '작성자는 필수입니다.']  // 반드시 입력해야 함
  },
  
  // 게시글 카테고리 (어떤 종류의 글인지)
  category: {
    type: String,                    // 문자열 타입
    enum: ['general', 'tech', 'lifestyle', 'travel', 'food', 'other'],  // 이 중 하나만 선택 가능
    default: 'general'               // 기본값은 일반 카테고리
  },
  
  // 태그들 (게시글에 달 수 있는 키워드들)
  tags: [{
    type: String,                    // 문자열 타입
    trim: true,                      // 앞뒤 공백 제거
    maxlength: [20, '태그는 최대 20자까지 가능합니다.']  // 최대 20글자
  }],
  
  // 첨부된 이미지들
  images: [{
    url: {                          // 이미지 파일의 주소
      type: String,
      required: true                // 반드시 입력해야 함
    },
    filename: {                     // 서버에 저장된 파일명
      type: String,
      required: true
    },
    originalName: {                 // 원래 파일명 (사용자가 업로드한 이름)
      type: String,
      required: true
    },
    size: {                         // 파일 크기 (바이트 단위)
      type: Number,
      required: true
    }
  }],
  
  // 좋아요 목록 (누가 좋아요를 눌렀는지)
  likes: [{
    user: {                         // 좋아요를 누른 사용자
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {                      // 좋아요를 누른 시간
      type: Date,
      default: Date.now             // 기본값은 현재 시간
    }
  }],
  
  // 댓글 목록
  comments: [{
    author: {                       // 댓글 작성자
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {                      // 댓글 내용
      type: String,
      required: [true, '댓글 내용은 필수입니다.'],
      maxlength: [1000, '댓글은 최대 1000자까지 가능합니다.']
    },
    createdAt: {                    // 댓글 작성 시간
      type: Date,
      default: Date.now
    },
    updatedAt: {                    // 댓글 수정 시간
      type: Date,
      default: Date.now
    }
  }],
  
  // 게시글 공개 여부
  isPublished: {
    type: Boolean,                  // true 또는 false
    default: true                   // 기본값은 공개됨
  },
  
  // 조회수 (몇 번이나 봤는지)
  viewCount: {
    type: Number,                   // 숫자 타입
    default: 0                      // 기본값은 0번
  },
  
  // 슬러그 (URL에 사용할 수 있는 깔끔한 제목)
  slug: {
    type: String,                   // 문자열 타입
    unique: true,                   // 중복되면 안 됨
    lowercase: true                 // 소문자로 변환
  }
}, {
  timestamps: true,                 // createdAt, updatedAt 자동 생성
  toJSON: { virtuals: true },       // JSON으로 변환할 때 가상 필드도 포함
  toObject: { virtuals: true }      // 객체로 변환할 때 가상 필드도 포함
});

// 가상 필드: 좋아요 수 (실제로 저장되지 않지만 계산해서 보여주는 필드)
// 마치 "좋아요 개수를 세어주세요"라고 하는 기능입니다
postSchema.virtual('likesCount').get(function(this: IPostDocument): number {
  return this.likes.length;  // 좋아요 배열의 길이를 반환 (몇 개인지 세어줍니다)
});

// 가상 필드: 댓글 수 (실제로 저장되지 않지만 계산해서 보여주는 필드)
// 마치 "댓글 개수를 세어주세요"라고 하는 기능입니다
postSchema.virtual('commentsCount').get(function(this: IPostDocument): number {
  return this.comments.length;  // 댓글 배열의 길이를 반환 (몇 개인지 세어줍니다)
});

// 슬러그 생성 함수 (게시글을 저장하기 전에 실행됩니다)
// 슬러그는 URL에 사용할 수 있는 깔끔한 제목입니다
// 예: "안녕하세요!" → "안녕하세요"
postSchema.pre<IPostDocument>('save', function(next) {
  // 제목이 수정되었고, 아직 슬러그가 없다면 슬러그를 만들어줍니다
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()                    // 소문자로 변환
      .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈만 남김)
      .replace(/\s+/g, '-')            // 공백을 하이픈으로 변환
      .replace(/-+/g, '-')             // 연속된 하이픈을 하나로 합침
      .trim();                         // 앞뒤 공백 제거
  }
  next();  // 다음 단계로 넘어갑니다
});

// 댓글 업데이트 시간 갱신 함수 (게시글을 저장하기 전에 실행됩니다)
// 댓글이 수정되었을 때 수정 시간을 업데이트해줍니다
postSchema.pre<IPostDocument>('save', function(next) {
  // 댓글이 수정되었다면
  if (this.isModified('comments')) {
    // 모든 댓글을 확인해서
    this.comments.forEach(comment => {
      // 수정된 댓글이 있다면
      if (comment.isModified && comment.isModified()) {
        comment.updatedAt = new Date();  // 수정 시간을 현재 시간으로 업데이트
      }
    });
  }
  next();  // 다음 단계로 넘어갑니다
});

// 인덱스 설정 (데이터베이스에서 빠르게 검색하기 위한 설정)
// 인덱스는 마치 도서관의 색인과 같아요 - 원하는 책을 빠르게 찾을 수 있게 해줍니다

postSchema.index({ author: 1, createdAt: -1 });     // 작성자별, 최신순으로 빠르게 검색
postSchema.index({ category: 1, createdAt: -1 });   // 카테고리별, 최신순으로 빠르게 검색
postSchema.index({ tags: 1 });                      // 태그로 빠르게 검색
postSchema.index({ slug: 1 });                      // 슬러그로 빠르게 검색
postSchema.index({ title: 'text', content: 'text' }); // 제목과 내용에서 텍스트 검색

// 정적 메서드: 인기 게시물 조회 (모든 게시물에서 사용할 수 있는 함수)
// 이 함수는 "가장 인기 있는 게시물들을 찾아주세요"라고 하는 기능입니다
postSchema.statics.getPopularPosts = function(this: IPostModel, limit: number = 10): Promise<IPostDocument[]> {
  return this.find({ isPublished: true })           // 공개된 게시물만 찾기
    .sort({ viewCount: -1, likesCount: -1 })        // 조회수 많은 순, 좋아요 많은 순으로 정렬
    .limit(limit)                                   // 지정된 개수만큼만 가져오기
    .populate('author', 'username profile.firstName profile.lastName profile.avatar'); // 작성자 정보도 함께 가져오기
};

// 정적 메서드: 카테고리별 게시물 조회
// 이 함수는 "특정 카테고리의 게시물들을 찾아주세요"라고 하는 기능입니다
postSchema.statics.getPostsByCategory = function(
  this: IPostModel, 
  category: string, 
  page: number = 1, 
  limit: number = 10
): Promise<IPostDocument[]> {
  const skip = (page - 1) * limit;                  // 건너뛸 개수 계산 (페이지네이션용)
  return this.find({ category, isPublished: true }) // 해당 카테고리의 공개 게시물만 찾기
    .sort({ createdAt: -1 })                        // 최신순으로 정렬
    .skip(skip)                                     // 건너뛰기
    .limit(limit)                                   // 지정된 개수만큼만 가져오기
    .populate('author', 'username profile.firstName profile.lastName profile.avatar'); // 작성자 정보도 함께 가져오기
};

// 인스턴스 메서드: 조회수 증가 (특정 게시물에서 사용할 수 있는 함수)
// 이 함수는 "이 게시물의 조회수를 1 증가시켜주세요"라고 하는 기능입니다
postSchema.methods.incrementViewCount = function(this: IPostDocument): Promise<IPostDocument> {
  this.viewCount += 1;        // 조회수를 1 증가시킵니다
  return this.save();         // 변경사항을 데이터베이스에 저장합니다
};

// 인스턴스 메서드: 좋아요 토글 (특정 게시물에서 사용할 수 있는 함수)
// 이 함수는 "이 게시물에 좋아요를 누르거나 취소해주세요"라고 하는 기능입니다
postSchema.methods.toggleLike = function(this: IPostDocument, userId: string): { liked: boolean; likesCount: number } {
  // 이미 좋아요를 누른 사용자인지 확인합니다
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    // 이미 좋아요를 누른 경우 제거합니다 (좋아요 취소)
    this.likes.splice(likeIndex, 1);
    return { liked: false, likesCount: this.likes.length };  // 좋아요 취소됨, 현재 좋아요 수
  } else {
    // 좋아요를 누르지 않은 경우 추가합니다 (좋아요 누름)
    this.likes.push({ user: userId });
    return { liked: true, likesCount: this.likes.length };   // 좋아요 누름, 현재 좋아요 수
  }
};

// 이 스키마를 'Post'라는 이름으로 모델을 만들어서 내보냅니다
// 이제 다른 파일에서 Post 모델을 사용할 수 있습니다
const Post = mongoose.model<IPostDocument, IPostModel>('Post', postSchema);

export default Post;
