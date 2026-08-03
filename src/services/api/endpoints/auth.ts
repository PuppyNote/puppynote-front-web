/**
 * 인증 관련 엔드포인트.
 *
 * 스펙 근거는 puppynote-server의 실제 컨트롤러/DTO입니다.
 *   - `user/users/controller/LoginController.java`
 *   - `user/users/controller/UserController.java`
 *   - `user/users/controller/request/*.java`
 * 네이티브 앱(`puppynote-front-app/src/services/auth/AuthService.ts`)과 같은 요청 형태를 씁니다.
 */
import { apiService } from '../ApiService'
import { unwrapApiResponse } from '../types'

/** 서버 `SnsType` enum. NORMAL은 일반 가입이라 OAuth 요청에는 쓰지 않습니다. */
export type SnsType = 'KAKAO' | 'GOOGLE' | 'APPLE'

/** 서버 `SettingStatus` enum */
export type SettingStatus = 'INCOMPLETE' | 'COMPLETE'

export interface LoginParams {
  email: string
  password: string
  /**
   * 서버 `LoginRequest.deviceId`는 `@NotNull` **필수**입니다.
   * 리프레시 토큰이 기기 단위로 저장되므로(`User.checkRefreshToken`) 값이 안정적이어야 합니다.
   * {@link ../../auth/device.getDeviceInfo}에서 받아오세요.
   */
  deviceId: string
  /** 푸시 토큰. 서버에서 선택값이라 없으면 null을 보냅니다. */
  pushKey?: string | null
}

export interface OAuthLoginParams {
  /** 카카오는 SDK accessToken, 애플은 identityToken(JWT) */
  token: string
  snsType: SnsType
  deviceId: string
  pushKey?: string | null
}

/**
 * 로그인 성공 응답.
 *
 * ⚠️ `settingStatus`는 서버 `LoginResponse.of()`가 채우지 않아 현재 **항상 null**로 내려옵니다.
 * 네이티브도 값을 받아만 두고 분기에 쓰지 않으므로 웹도 이 값으로 화면을 나누지 않습니다.
 */
export interface LoginData {
  email: string
  accessToken: string
  refreshToken: string
  settingStatus: SettingStatus | null
}

export interface SignUpParams {
  email: string
  nickName: string
  password: string
}

export interface SignUpData {
  email: string
  nickName: string
}

export const authApi = {
  /** 이메일 로그인 */
  async login(params: LoginParams): Promise<LoginData> {
    const response = await apiService.post<LoginData>('/api/v1/auth/login', {
      email: params.email,
      password: params.password,
      deviceId: params.deviceId,
      pushKey: params.pushKey ?? null,
    })
    return unwrapApiResponse(response, 200, '로그인에 실패했습니다.')
  },

  /** 카카오/애플 로그인. 앱에서 SDK로 받은 토큰을 서버가 검증하고 우리 JWT를 내려줍니다. */
  async oauthLogin(params: OAuthLoginParams): Promise<LoginData> {
    const response = await apiService.post<LoginData>('/api/v1/auth/oauth/login', {
      token: params.token,
      snsType: params.snsType,
      deviceId: params.deviceId,
      pushKey: params.pushKey ?? null,
    })
    return unwrapApiResponse(response, 200, 'SNS 로그인에 실패했습니다.')
  },

  /** 회원가입. 서버가 201을 내려줍니다(200이 아님). */
  async signUp(params: SignUpParams): Promise<SignUpData> {
    const response = await apiService.post<SignUpData>('/api/v1/user/signup', params)
    return unwrapApiResponse(response, 201, '회원가입에 실패했습니다.')
  },

  /**
   * 회원가입용 이메일 인증번호 발송.
   * 응답 `data`가 **인증번호 문자열 그 자체**입니다(서버 유효시간 3분).
   * 대조는 클라이언트가 합니다 - 서버에 검증 엔드포인트가 없습니다(`EmailService.verifyCode`는 미노출).
   */
  async sendSignUpCode(email: string): Promise<string> {
    const response = await apiService.post<string>('/api/v1/user/email/send', { email })
    return unwrapApiResponse(response, 200, '인증번호 발송에 실패했습니다.')
  },

  /** 비밀번호 재설정용 인증번호 발송. 가입되지 않은 이메일이면 404로 떨어집니다. */
  async sendPasswordResetCode(email: string): Promise<string> {
    const response = await apiService.post<string>('/api/v1/auth/password/email/send', { email })
    return unwrapApiResponse(response, 200, '인증번호 발송에 실패했습니다.')
  },

  /** 비밀번호 재설정 */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const response = await apiService.post<null>('/api/v1/auth/password/reset', {
      email,
      newPassword,
    })
    unwrapApiResponse(response, 200, '비밀번호 재설정에 실패했습니다.')
  },
}
