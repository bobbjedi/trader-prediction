module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    mocha: true,
    node: true,
  },

  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    'space-before-function-paren': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'spaced-comment': ['error', 'always'],
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
    'arrow-spacing': ['error', { 'before': true, 'after': true }],
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single'],
    'semi': ['warn', 'never'],
    'semi-spacing': ['error', { 'before': false, 'after': true }],
    'indent': ['error', 2],
    'space-infix-ops': 'error',
    'eqeqeq': 'error',
    'no-eq-null': 'error',
    'curly': 'error',
    'key-spacing': ['error', { 'mode': 'strict' }],
    'eol-last': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never'],
    'no-multi-spaces': 'error',
    'no-sparse-arrays': 'warn',
    'no-mixed-spaces-and-tabs': 'error',
    'keyword-spacing': ['error', { 'after': true, 'before': true }],
    'space-before-blocks': 'error',
    'block-spacing': 'error',
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'no-undef': 'error',
    'array-callback-return': 'error',
    // 'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
  },
  parserOptions: {
    ecmaVersion: 12,
  },
}