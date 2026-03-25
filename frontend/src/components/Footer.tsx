import React from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@mui/material'
import {
  MailOutline,
  FacebookTwoTone as FacebookIcon,
  X,
  LinkedIn,
  Instagram,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/footer'
import NewsletterForm from '@/components/NewsletterForm'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'

import Stripe from '@/assets/img/stripe.png'
import PayPal from '@/assets/img/paypal.png'
import '@/assets/css/footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const language = UserService.getLanguage()

  return (
    <div className="footer" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <div className="header">{env.WEBSITE_NAME}</div>
      <section className="main">
        <div className="main-section">
          <div className="title">{strings.CORPORATE}</div>
          <ul className="links">
            <li onClick={() => navigate('/about')}>{strings.ABOUT}</li>
            <li onClick={() => navigate('/cookie-policy')}>{strings.COOKIE_POLICY}</li>
            <li onClick={() => navigate('/privacy')}>{strings.PRIVACY_POLICY}</li>
            <li onClick={() => navigate('/tos')}>{strings.TOS}</li>
          </ul>
        </div>
        <div className="main-section">
          <div className="title">{strings.RENT}</div>
          <ul className="links">
            {!env.HIDE_SUPPLIERS && <li onClick={() => navigate('/suppliers')}>{strings.SUPPLIERS}</li>}
            <li onClick={() => navigate('/locations')}>{strings.LOCATIONS}</li>
          </ul>
        </div>
        <div className="main-section">
          <div className="title">{strings.SUPPORT}</div>
          <ul className="links">
            <li onClick={() => navigate('/contact')}>{strings.CONTACT}</li>
            <li onClick={() => navigate('/faq')}>{strings.FAQ}</li>
          </ul>
          <div className="footer-contact">
            <MailOutline className="icon" />
            <a href={`mailto:${env.CONTACT_EMAIL}`}>{env.CONTACT_EMAIL}</a>
          </div>
          <div className="footer-contact">
            <IconButton href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label={strings.SOCIAL_FACEBOOK} className="social-icon"><FacebookIcon /></IconButton>
            <IconButton href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label={strings.SOCIAL_X} className="social-icon"><X /></IconButton>
            <IconButton href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label={strings.SOCIAL_LINKEDIN} className="social-icon"><LinkedIn /></IconButton>
            <IconButton href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label={strings.SOCIAL_INSTAGRAM} className="social-icon"><Instagram /></IconButton>
          </div>
          <div className="newsletter">
            <NewsletterForm />
          </div>
        </div>
      </section>
      <section className="payment">
        <div
          className="payment-text"
          style={{
            margin: env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal ? '0 20px'
              : env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.MyFatoorah ? '0 12px'
                : '-25px 10px 0 0',
          }}
        >
          {strings.SECURE_PAYMENT}
        </div>
        {env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.MyFatoorah ? (
          <span className="payment-myfatoorah" aria-label={strings.PAYMENT_MYFATOORAH}>
            {strings.PAYMENT_MYFATOORAH}
          </span>
        ) : (
          <img
            src={env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal ? PayPal : Stripe}
            alt={env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal ? strings.ALT_PAYMENT_PAYPAL : strings.ALT_PAYMENT_STRIPE}
            style={{ height: env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal ? 64 : 'auto' }}
          />
        )}
      </section>
      <section className="copyright">
        <div className="copyright">
          <span>{strings.COPYRIGHT_PART1}</span>
          <span>{strings.COPYRIGHT_PART2}</span>
        </div>
      </section>
    </div>
  )
}
export default Footer
