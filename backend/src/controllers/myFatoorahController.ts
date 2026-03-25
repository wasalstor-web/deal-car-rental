import { Request, Response } from 'express'
import i18n from '../lang/i18n'
import * as logger from '../utils/logger'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import Booking from '../models/Booking'
import User from '../models/User'
import Car from '../models/Car'
import * as bookingController from './bookingController'
import * as myfatoorah from '../payment/myfatoorah'

const normalizeStatus = (s: string | undefined) => (s || '').trim()

/**
 * Create MyFatoorah invoice and return hosted payment URL (redirect customer).
 */
export const createPayment = async (req: Request, res: Response) => {
  try {
    const {
      bookingId,
      amount,
      currency,
      name,
      description,
      customerEmail,
      customerName,
      language,
    }: bookcarsTypes.CreateMyFatoorahPaymentPayload = req.body

    if (!bookingId || amount == null || !currency || !customerEmail || !customerName) {
      res.status(400).send('Invalid MyFatoorah payment payload')
      return
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      status: bookcarsTypes.BookingStatus.Void,
      expireAt: { $ne: null },
    })
    if (!booking) {
      res.status(400).send('Booking not found or not awaiting payment')
      return
    }

    const callbackBase = helper.joinURL(env.FRONTEND_HOST, 'checkout-myfatoorah')
    const callBackUrl = `${callbackBase}?bookingId=${encodeURIComponent(bookingId)}`
    const errorUrl = `${callbackBase}?bookingId=${encodeURIComponent(bookingId)}&failed=1`

    const lang = (language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en'

    const data = await myfatoorah.executePayment({
      PaymentMethodId: env.MYFATOORAH_PAYMENT_METHOD_ID,
      InvoiceValue: amount,
      CustomerName: customerName,
      DisplayCurrencyIso: currency.toUpperCase(),
      CustomerEmail: customerEmail,
      CallBackUrl: callBackUrl,
      ErrorUrl: errorUrl,
      Language: lang,
      CustomerReference: bookingId,
      InvoiceItems: [
        {
          ItemName: name,
          Quantity: 1,
          UnitPrice: amount,
        },
      ],
    })

    if (!data.PaymentURL) {
      res.status(400).send('MyFatoorah did not return a payment URL')
      return
    }

    res.json({ paymentUrl: data.PaymentURL, invoiceId: data.InvoiceId })
  } catch (err) {
    logger.error(`[myfatoorah.createPayment] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Confirm payment after customer returns from MyFatoorah (CallBackUrl includes paymentId).
 */
export const checkPayment = async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentId } = req.params

    const booking = await Booking.findOne({ _id: bookingId, expireAt: { $ne: null } })
    if (!booking) {
      const msg = `Booking with id ${bookingId} not found`
      logger.info(`[myfatoorah.checkPayment] ${msg}`)
      res.status(204).send(msg)
      return
    }

    let statusData: myfatoorah.PaymentStatusData
    try {
      statusData = await myfatoorah.getPaymentStatus(paymentId, 'PaymentId')
    } catch (err) {
      logger.error(`[myfatoorah.checkPayment] GetPaymentStatus error: ${paymentId}`, err)
      res.status(400).send(i18n.t('ERROR') + err)
      return
    }

    if (statusData.CustomerReference && statusData.CustomerReference !== bookingId) {
      logger.error(`[myfatoorah.checkPayment] CustomerReference mismatch for booking ${bookingId}`)
      res.status(400).send('Invalid payment reference')
      return
    }

    const invoiceStatus = normalizeStatus(statusData.InvoiceStatus)
    if (invoiceStatus === 'Paid') {
      booking.myFatoorahPaymentId = paymentId
      booking.expireAt = undefined

      let status = bookcarsTypes.BookingStatus.Paid
      if (booking.isDeposit) {
        status = bookcarsTypes.BookingStatus.Deposit
      } else if (booking.isPayedInFull) {
        status = bookcarsTypes.BookingStatus.PaidInFull
      }
      booking.status = status

      await booking.save()

      const car = await Car.findById(booking.car)
      if (!car) {
        throw new Error(`Car ${booking.car} not found`)
      }
      car.trips += 1
      await car.save()

      const supplier = await User.findById(booking.supplier)
      if (!supplier) {
        throw new Error(`Supplier ${booking.supplier} not found`)
      }

      const user = await User.findById(booking.driver)
      if (!user) {
        throw new Error(`Driver ${booking.driver} not found`)
      }

      user.expireAt = undefined
      await user.save()

      if (!(await bookingController.confirm(user, supplier, booking, false))) {
        res.sendStatus(400)
        return
      }

      i18n.locale = supplier.language
      let message = i18n.t('BOOKING_PAID_NOTIFICATION')
      await bookingController.notify(user, booking._id.toString(), supplier, message)

      const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
      if (admin) {
        i18n.locale = admin.language
        message = i18n.t('BOOKING_PAID_NOTIFICATION')
        await bookingController.notify(user, booking._id.toString(), admin, message)
      }

      res.sendStatus(200)
      return
    }

    await booking.deleteOne()
    res.status(400).send(invoiceStatus || 'Payment not completed')
  } catch (err) {
    logger.error(`[myfatoorah.checkPayment] ${i18n.t('ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
