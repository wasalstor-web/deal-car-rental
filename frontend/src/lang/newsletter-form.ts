import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: 'Abonnez-vous',
    SUB_TITLE: 'Abonnez-vous à notre liste de diffusion pour recevoir les dernières mises à jour !',
    SUBSCRIBE: "S'abonner",
    SUCCESS: 'Inscription réussie !',
  },
  en: {
    TITLE: 'Subscribe',
    SUB_TITLE: 'Subscribe to our mailing list for the latest updates!',
    SUBSCRIBE: 'Subscribe',
    SUCCESS: 'Subscription successful!',
  },
  es: {
    TITLE: 'Suscribir',
    SUB_TITLE: '¡Suscríbete a nuestra lista de correo para recibir las últimas actualizaciones!',
    SUBSCRIBE: 'Suscribir',
    SUCCESS: '¡Suscripción exitosa!',
  },
  ar: {
    TITLE: 'النشرة البريدية',
    SUB_TITLE: 'اشترك في قائمتنا البريدية لتصلك آخر الأخبار والعروض.',
    SUBSCRIBE: 'اشترك',
    SUCCESS: 'الاشتراك ناجح!',

  },
})

langHelper.setLanguage(strings)
export { strings }
