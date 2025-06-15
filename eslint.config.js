import js from '@eslint/js';
import globals from 'globals';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // Prettier will handle all formatting rules
      'prettier/prettier': 'error',

      // Non-formatting rules that don't conflict with Prettier
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Disable all formatting rules that Prettier handles
      // These are already disabled by eslint-config-prettier, but being explicit
      indent: 'off',
      semi: 'off',
      quotes: 'off',
      'comma-dangle': 'off',
      'no-trailing-spaces': 'off',
      'eol-last': 'off',
      'arrow-parens': 'off',
      'space-before-function-paren': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'computed-property-spacing': 'off',
      'brace-style': 'off',
      'comma-spacing': 'off',
      'func-call-spacing': 'off',
      'key-spacing': 'off',
      'keyword-spacing': 'off',
      'linebreak-style': 'off',
      'max-len': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'no-multiple-empty-lines': 'off',
      'no-tabs': 'off',
      'no-whitespace-before-property': 'off',
      'operator-linebreak': 'off',
      'padded-blocks': 'off',
      'quote-props': 'off',
      'space-in-parens': 'off',
      'space-infix-ops': 'off',
      'space-unary-ops': 'off',
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    },
  },
  {
    files: ['js/logger.js'],
    rules: {
      'no-console': 'off', // Logger needs direct console access
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', '*.min.js'],
  },
];
