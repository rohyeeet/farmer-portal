export type LoginOtpRequestBody = {
  mobile_number: string
}

export type LoginOtpResponseBody = {
  transaction_id: string
}

export type ResendOtpRequestBody = {
  transaction_id: string
}

export type ResendOtpResponseBody = {
  transaction_id: string
}

export type ValidateOtpRequestBody = {
  transaction_id: string
  otp: string
}

export type ValidateOtpResponseBody = {
  token: {
    token_type: string
    access_token: string
    refresh_token: string
  }
  x_header: {
    name: string
    value: string
  }
}
