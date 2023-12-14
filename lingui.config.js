/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'hi', 'ja', 'ko'],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
