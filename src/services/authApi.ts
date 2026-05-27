import { getApiUrl } from '../config/apiRegistry'
import type {
  LoginOtpRequestBody,
  LoginOtpResponseBody,
  ResendOtpRequestBody,
  ResendOtpResponseBody,
  ValidateOtpRequestBody,
  ValidateOtpResponseBody,
} from '../types/auth.api'
import { postJson } from './http/postJson'

export async function requestLoginOtp(body: LoginOtpRequestBody): Promise<LoginOtpResponseBody> {
  return postJson<LoginOtpResponseBody>(getApiUrl('loginOtp'), body)
}

export async function requestResendLoginOtp(
  body: ResendOtpRequestBody,
): Promise<ResendOtpResponseBody> {
  return postJson<ResendOtpResponseBody>(getApiUrl('loginOtpResend'), body)
}

export async function requestValidateLoginOtp(
  body: ValidateOtpRequestBody,
): Promise<ValidateOtpResponseBody> {
  return postJson<ValidateOtpResponseBody>(getApiUrl('loginValidate'), body)
}
