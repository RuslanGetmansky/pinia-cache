module.exports = {
  plugins: ['jest'],
  extends: ['plugin:jest/recommended'],
  env: {
    'jest/globals': true,
  },
  rules: {
    'react/prop-types': 0,
    '@typescript-eslint/no-empty-function': 0,
  },
}
