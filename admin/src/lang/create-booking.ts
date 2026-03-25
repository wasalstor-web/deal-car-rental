import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_BOOKING_HEADING: 'Nouvelle réservation',
  },
  en: {
    NEW_BOOKING_HEADING: 'New booking',
  },
  es: {
    NEW_BOOKING_HEADING: 'Nueva reserva',
  },
  ar: {
    NEW_BOOKING_HEADING: 'حجز جديد',

  },
})

langHelper.setLanguage(strings)
export { strings }
