// 필요한 라이브러리들을 가져옵니다
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

// 사용자 문서 인터페이스 (MongoDB 문서와 TypeScript 타입을 연결)
export interface IUserDocument extends IUser, Document {
  // 인스턴스 메서드들
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): IUser;
}

// 사용자 모델 인터페이스 (정적 메서드들을 위한)
export interface IUserModel extends Model<IUserDocument> {
  // 정적 메서드들을 여기에 추가할 수 있습니다
  // 예: findByEmail(email: string): Promise<IUserDocument | null>;
}

// 사용자 정보를 저장할 스키마(틀)를 만듭니다
// 스키마는 데이터베이스에 어떤 정보를 어떻게 저장할지 정하는 설계도입니다
// 마치 학생증을 만들 때 어떤 정보를 넣을지 미리 정하는 것과 같아요
const userSchema = new Schema<IUserDocument>({
  // 사용자명 (로그인할 때 사용하는 이름)
  username: {
    type: String,                    // 문자열 타입
    required: [true, '사용자명은 필수입니다.'],  // 반드시 입력해야 함
    unique: true,                    // 다른 사용자와 중복되면 안 됨
    trim: true,                      // 앞뒤 공백 제거
    minlength: [3, '사용자명은 최소 3자 이상이어야 합니다.'],  // 최소 3글자
    maxlength: [20, '사용자명은 최대 20자까지 가능합니다.']   // 최대 20글자
  },
  
  // 이메일 주소
  email: {
    type: String,                    // 문자열 타입
    required: [true, '이메일은 필수입니다.'],    // 반드시 입력해야 함
    unique: true,                    // 다른 사용자와 중복되면 안 됨
    lowercase: true,                 // 소문자로 변환 (ABC@GMAIL.COM → abc@gmail.com)
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '올바른 이메일 형식이 아닙니다.']  // 이메일 형식 검증
  },
  
  // 비밀번호
  password: {
    type: String,                    // 문자열 타입
    required: [true, '비밀번호는 필수입니다.'],  // 반드시 입력해야 함
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.']  // 최소 6글자
  },
  
  // 프로필 정보 (사용자의 상세 정보)
  profile: {
    // 이름
    firstName: {
      type: String,                  // 문자열 타입
      trim: true,                    // 앞뒤 공백 제거
      maxlength: [50, '이름은 최대 50자까지 가능합니다.']  // 최대 50글자
    },
    // 성
    lastName: {
      type: String,                  // 문자열 타입
      trim: true,                    // 앞뒤 공백 제거
      maxlength: [50, '성은 최대 50자까지 가능합니다.']   // 최대 50글자
    },
    // 프로필 사진
    avatar: {
      type: String,                  // 문자열 타입 (이미지 파일 경로)
      default: null                  // 기본값은 없음
    },
    // 자기소개
    bio: {
      type: String,                  // 문자열 타입
      maxlength: [500, '자기소개는 최대 500자까지 가능합니다.']  // 최대 500글자
    }
  },
  
  // 사용자 역할 (권한)
  role: {
    type: String,                    // 문자열 타입
    enum: ['user', 'admin', 'moderator'],  // 이 세 가지 중 하나만 가능
    default: 'user'                  // 기본값은 일반 사용자
  },
  
  // 계정 활성화 상태
  isActive: {
    type: Boolean,                   // true 또는 false
    default: true                    // 기본값은 활성화됨
  },
  
  // 마지막 로그인 시간
  lastLogin: {
    type: Date,                      // 날짜 타입
    default: null                    // 기본값은 없음
  }
}, {
  timestamps: true,                  // createdAt, updatedAt 자동 생성 (언제 만들었는지, 언제 수정했는지)
  toJSON: { virtuals: true },        // JSON으로 변환할 때 가상 필드도 포함
  toObject: { virtuals: true }       // 객체로 변환할 때 가상 필드도 포함
});

// 가상 필드: 전체 이름 (실제로 저장되지 않지만 필요할 때 계산해서 보여주는 필드)
// 마치 "이름 + 성"을 합쳐서 전체 이름을 만드는 것과 같아요
userSchema.virtual('profile.fullName').get(function(this: IUserDocument): string {
  // 이름과 성이 모두 있으면 합쳐서 보여줍니다
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  // 이름이나 성이 없으면 사용자명을 보여줍니다
  return this.username;
});

// 비밀번호를 암호화하는 함수 (데이터베이스에 저장하기 전에 실행됩니다)
// 이 함수는 "비밀번호를 안전하게 저장하기 위해 암호화해주세요"라고 하는 기능입니다
userSchema.pre<IUserDocument>('save', async function(next) {
  // 비밀번호가 수정되지 않았다면 암호화할 필요가 없으므로 다음 단계로 넘어갑니다
  if (!this.isModified('password')) return next();
  
  try {
    // 1단계: 솔트(salt)를 생성합니다
    // 솔트는 비밀번호를 더 안전하게 암호화하기 위해 추가하는 랜덤 문자열입니다
    // 마치 요리에 소금을 넣어서 맛을 더하는 것과 비슷해요
    const salt = await bcrypt.genSalt(12);
    
    // 2단계: 비밀번호를 솔트와 함께 암호화합니다
    // 이렇게 하면 원래 비밀번호를 알아낼 수 없게 됩니다
    this.password = await bcrypt.hash(this.password, salt);
    
    // 3단계: 다음 단계로 넘어갑니다
    next();
  } catch (error) {
    // 에러가 발생하면 에러를 다음 단계로 전달합니다
    next(error as Error);
  }
});

// 비밀번호를 비교하는 함수
// 이 함수는 "입력한 비밀번호가 맞는지 확인해주세요"라고 하는 기능입니다
userSchema.methods.comparePassword = async function(this: IUserDocument, candidatePassword: string): Promise<boolean> {
  // bcrypt.compare는 암호화된 비밀번호와 일반 비밀번호를 비교해줍니다
  // 마치 자물쇠를 열어보는 것과 같아요
  return await bcrypt.compare(candidatePassword, this.password);
};

// 사용자 정보를 JSON으로 변환할 때 비밀번호를 제외하는 함수
// 이 함수는 "사용자 정보를 보여줄 때는 비밀번호는 빼고 보여주세요"라고 하는 기능입니다
userSchema.methods.toJSON = function(this: IUserDocument): IUser {
  // 사용자 정보를 객체로 변환합니다
  const user = this.toObject();
  
  // 비밀번호 필드를 삭제합니다 (보안상 중요하므로)
  delete user.password;
  
  // 비밀번호가 제거된 사용자 정보를 반환합니다
  return user as IUser;
};

// 인덱스 설정 (데이터베이스에서 빠르게 검색하기 위한 설정)
// 인덱스는 마치 도서관의 색인과 같아요 - 원하는 책을 빠르게 찾을 수 있게 해줍니다

userSchema.index({ email: 1 });        // 이메일로 빠르게 검색할 수 있게 설정 (1은 오름차순)
userSchema.index({ username: 1 });     // 사용자명으로 빠르게 검색할 수 있게 설정
userSchema.index({ createdAt: -1 });   // 생성일자로 빠르게 검색할 수 있게 설정 (-1은 내림차순)

// 이 스키마를 'User'라는 이름으로 모델을 만들어서 내보냅니다
// 이제 다른 파일에서 User 모델을 사용할 수 있습니다
const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
