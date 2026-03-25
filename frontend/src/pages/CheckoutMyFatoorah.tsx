import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { strings } from '@/lang/checkout'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import * as MyFatoorahService from '@/services/MyFatoorahService'
import * as UserService from '@/services/UserService'
import Info from './Info'
import CheckoutStatus from '@/components/CheckoutStatus'
import Error from '@/components/Error'

import '@/assets/css/checkout-session.css'

const sleep = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms)
})

/**
 * MyFatoorah may append paymentId with varying casing; collect case-insensitively.
 */
const readPaymentId = (params: URLSearchParams): string => {
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() === 'paymentid' && value) {
      return value
    }
  }
  return ''
}

/**
 * Return URL after MyFatoorah hosted payment (CallBackUrl / ErrorUrl).
 * Expects: ?bookingId=...&paymentId=... on success; ?bookingId=...&failed=1 on cancel/error from gateway.
 */
const CheckoutMyFatoorah = () => {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId') || ''
  const paymentId = readPaymentId(searchParams)
  const failed = searchParams.get('failed')

  const [loading, setLoading] = useState(true)
  const [noMatch, setNoMatch] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!bookingId) {
        setNoMatch(true)
        setLoading(false)
        return
      }
      if (failed === '1' || !paymentId) {
        setErrorMessage(strings.PAYMENT_FAILED)
        setLoading(false)
        return
      }

      const maxClientAttempts = 4
      const clientDelayMs = 2000

      try {
        setLoading(true)
        for (let attempt = 0; attempt < maxClientAttempts && !cancelled; attempt++) {
          const { status, body } = await MyFatoorahService.checkPayment(bookingId, paymentId)
          if (status === 200) {
            setNoMatch(false)
            setSuccess(true)
            setErrorMessage(null)
            break
          }
          if (status === 204) {
            setNoMatch(true)
            setSuccess(false)
            break
          }
          const stillProcessing = (body || '').toLowerCase().includes('still processing')
          if (status === 400 && stillProcessing && attempt < maxClientAttempts - 1) {
            await sleep(clientDelayMs)
            continue
          }
          setNoMatch(false)
          setSuccess(false)
          setErrorMessage(strings.PAYMENT_FAILED)
          break
        }
      } catch {
        if (!cancelled) {
          setSuccess(false)
          setErrorMessage(strings.PAYMENT_FAILED)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [bookingId, paymentId, failed])

  return (
    <Layout>
      <div className="checkout-session">
        {loading && <Info message={strings.CHECKING} hideLink />}
        {!loading && noMatch && <NoMatch hideHeader />}
        {!loading && !noMatch && errorMessage && (
          <div className="form-error checkout-session">
            <Error message={errorMessage} />
          </div>
        )}
        {!loading && !noMatch && success && bookingId && (
          <CheckoutStatus
            bookingId={bookingId}
            language={UserService.getLanguage()}
            status="success"
            className="status"
          />
        )}
      </div>
    </Layout>
  )
}

export default CheckoutMyFatoorah
