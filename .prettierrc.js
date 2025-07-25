/** @type {import('prettier').Config} */
module.exports = {
  // Formatting options
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  printWidth: 100,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',

  // Plugin configurations
  plugins: ['prettier-plugin-tailwindcss'],

  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: true,
      },
    },
    {
      files: '*.css',
      options: {
        singleQuote: false,
      },
    },
  ],
}