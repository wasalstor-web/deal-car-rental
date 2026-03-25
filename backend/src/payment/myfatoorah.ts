import axios from 'axios'
import * as env from '../config/env.config'

const api = () => {
  if (!env.MYFATOORAH_API_KEY) {
    throw new Error('BC_MYFATOORAH_API_KEY is not set')
  }
  return axios.create({
    baseURL: env.MYFATOORAH_API_URL,
    headers: {
      Authorization: `Bearer ${env.MYFATOORAH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })
}

export interface ExecutePaymentData {
  InvoiceId: number
  PaymentURL: string
  CustomerReference?: string
}

export const executePayment = async (body: Record<string, unknown>): Promise<ExecutePaymentData> => {
  const { data } = await api().post('/v2/ExecutePayment', body)
  if (!data.IsSuccess) {
    const parts = [data.Message, ...(data.ValidationErrors || [])].filter(Boolean)
    throw new Error(parts.join(' ') || 'MyFatoorah ExecutePayment failed')
  }
  return data.Data
}

export interface PaymentStatusData {
  InvoiceStatus: string
  CustomerReference?: string
}

export const getPaymentStatus = async (key: string, keyType: 'PaymentId' | 'InvoiceId' | 'CustomerReference' | 'invoiceid'): Promise<PaymentStatusData> => {
  const { data } = await api().post('/v2/GetPaymentStatus', { Key: key, KeyType: keyType })
  if (!data.IsSuccess) {
    const parts = [data.Message, ...(data.ValidationErrors || [])].filter(Boolean)
    throw new Error(parts.join(' ') || 'MyFatoorah GetPaymentStatus failed')
  }
  return data.Data
}
