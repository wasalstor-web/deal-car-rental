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

/**
 * Confirm payment after return from MyFatoorah (CallBackUrl includes paymentId).
 */
export const checkPayment = async (bookingId: string, paymentId: string): Promise<number> => {
  const encodedPid = encodeURIComponent(paymentId)
  try {
    const res = await axiosInstance.post(
      `/api/check-myfatoorah-payment/${bookingId}/${encodedPid}`,
      null,
    )
    return res.status
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.status
    }
    throw err
  }
}
