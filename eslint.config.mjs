import tseslint from '@electron-toolkit/eslint-config-ts'
import prettier from '@electron-toolkit/eslint-config-prettier'

export default [
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', 'WhatsApp-Parallel/**']
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': ['warn', { endOfLine: 'auto' }]
    }
  }
]
