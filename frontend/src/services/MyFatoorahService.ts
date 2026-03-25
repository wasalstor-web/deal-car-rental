import axios from 'axios'
import axiosInstance from './axiosInstance'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Start MyFatoorah hosted checkout; backend returns PaymentURL to redirect the browser.
 */
export const createPayment = (payload: bookcarsTypes.CreateMyFatoorahPaymentPayload): Promise<{ paymentUrl: string; invoiceId?: number }> =>
  axiosInstance
    .post('/api/create-myfatoorah-payment/', payload)
    .then((res) => res.data)

export interface MyFatoorahCheckPaymentResult {
  status: number
  body?: string
}

const responseBody = (data: unknown): string | undefined => {
  if (typeof data === 'string') {
    return data
  }
  if (data != null && typeof data === 'object') {
    return JSON.stringify(data)
  }
  if (data != null) {
    return String(data)
  }
  return undefined
}

/**
 * Confirm payment after return from MyFatoorah (CallBackUrl includes paymentId).
 */
export const checkPayment = async (bookingId: string, paymentId: string): Promise<MyFatoorahCheckPaymentResult> => {
  const encodedPid = encodeURIComponent(paymentId)
  try {
    const res = await axiosInstance.post(
      `/api/check-myfatoorah-payment/${bookingId}/${encodedPid}`,
      null,
    )
    return { status: res.status, body: responseBody(res.data) }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { status: err.response.status, body: responseBody(err.response.data) }
    }
    throw err
  }
}
