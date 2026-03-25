import { DevSettings, I18nManager } from 'react-native'
import * as Updates from 'expo-updates'
import i18n from '@/lang/i18n'

/**
 * Update i18n-js locale only (strings). Safe to call on every screen init.
 */
export function setI18nLocaleOnly(lang: string) {
  i18n.locale = lang
}

/**
 * Align React Native layout direction with locale (Arabic = RTL).
 * Triggers one reload when direction must flip (required by RN).
 */
export async function syncLayoutDirectionWithLocale(lang: string): Promise<void> {
  setI18nLocaleOnly(lang)
  const wantRtl = lang === 'ar'
  I18nManager.allowRTL(true)
  if (I18nManager.isRTL === wantRtl) {
    return
  }
  I18nManager.forceRTL(wantRtl)
  if (__DEV__) {
    DevSettings.reload()
    return
  }
  try {
    await Updates.reloadAsync()
  } catch {
    DevSettings.reload()
  }
}
