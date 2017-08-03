import * as i18next from 'i18next'

export const i18n = i18next
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    react: {
      wait: false,
      nsMode: 'default'
    }
  })


