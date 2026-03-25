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

/**
 * Return URL after MyFatoorah hosted payment (CallBackUrl / ErrorUrl).
 * Expects: ?bookingId=...&paymentId=... on success; ?bookingId=...&failed=1 on cancel/error from gateway.
 */
const CheckoutMyFatoorah = () => {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId') || ''
  const paymentId = searchParams.get('paymentId') || searchParams.get('PaymentId') || ''
  const failed = searchParams.get('failed')

  const [loading, setLoading] = useState(true)
  const [noMatch, setNoMatch] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
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
      try {
        setLoading(true)
        const status = await MyFatoorahService.checkPayment(bookingId, paymentId)
        setNoMatch(status === 204)
        setSuccess(status === 200)
        if (status !== 200 && status !== 204) {
          setErrorMessage(strings.PAYMENT_FAILED)
        }
      } catch {
        setSuccess(false)
        setErrorMessage(strings.PAYMENT_FAILED)
      } finally {
        setLoading(false)
      }
    }

    run()
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
