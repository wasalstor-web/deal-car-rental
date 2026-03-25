import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SIGN_IN_HEADING: 'Connexion',
    SIGN_IN: 'Se connecter',
    ERROR_IN_SIGN_IN: 'E-mail ou mot de passe incorrect.',
    IS_BLACKLISTED: 'Votre compte est suspendu.',
    RESET_PASSWORD: 'Mot de passe oublié ?',
    STAY_CONNECTED: 'Rester connecté',
    SIGN_IN_WITH_SUPABASE: 'Se connecter avec Supabase',
    SUPABASE_SIGN_IN_ERROR: 'Échec de la connexion Supabase. Vérifiez l’e-mail, le mot de passe et la configuration du serveur.',
  },
  en: {
    SIGN_IN_HEADING: 'Sign in',
    SIGN_IN: 'Sign in',
    ERROR_IN_SIGN_IN: 'Incorrect email or password.',
    IS_BLACKLISTED: 'Your account is suspended.',
    RESET_PASSWORD: 'Forgot password?',
    STAY_CONNECTED: 'Stay connected',
    SIGN_IN_WITH_SUPABASE: 'Sign in with Supabase',
    SUPABASE_SIGN_IN_ERROR: 'Supabase sign-in failed. Check email, password, and server configuration (JWT secret).',
  },
  es: {
    SIGN_IN_HEADING: 'Iniciar sesión',
    SIGN_IN: 'Iniciar sesión',
    ERROR_IN_SIGN_IN: 'Correo electrónico o contraseña incorrectos.',
    IS_BLACKLISTED: 'Su cuenta está suspendida?',
    RESET_PASSWORD: '¿Olvidó su contraseña?',
    STAY_CONNECTED: 'Manténgase conectado',
    SIGN_IN_WITH_SUPABASE: 'Iniciar sesión con Supabase',
    SUPABASE_SIGN_IN_ERROR: 'Error al iniciar sesión con Supabase. Revise correo, contraseña y configuración del servidor.',
  },
  ar: {
    SIGN_IN_HEADING: 'تسجيل الدخول',
    SIGN_IN: 'تسجيل الدخول',
    ERROR_IN_SIGN_IN: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    IS_BLACKLISTED: 'حسابك معلق.',
    RESET_PASSWORD: 'هل نسيت كلمة السر؟',
    STAY_CONNECTED: 'ابق على اتصال',
    SIGN_IN_WITH_SUPABASE: 'تسجيل الدخول عبر Supabase',
    SUPABASE_SIGN_IN_ERROR: 'فشل تسجيل الدخول عبر Supabase. تحقق من البريد وكلمة المرور وإعدادات السيرفر (JWT).',

  },
})

langHelper.setLanguage(strings)
export { strings }
