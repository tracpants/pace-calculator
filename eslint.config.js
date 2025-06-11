import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Event: 'readonly',
        Element: 'readonly',
        MutationObserver: 'readonly',
        HTMLElement: 'readonly',
        process: 'readonly',
        global: 'readonly',
        // Vite globals
        import: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    },
    plugins: {
      import: importPlugin,
      jsdoc: jsdocPlugin
    },
    rules: {
      // ===== CUSTOM RULES FOR PACE CALCULATOR PROJECT =====
      
      // Prevent hardcoded colors in JavaScript
      'no-hardcoded-colors': 'off', // Will be implemented as custom rule below
      
      // Naming conventions for Pace Calculator (relaxed for existing code)
      'camelcase': ['warn', {
        properties: 'always',
        ignoreDestructuring: false,
        ignoreImports: false,
        ignoreGlobals: false,
        allow: [
          // Allow specific patterns used in the project
          '^METERS_PER_',
          '^SECONDS_PER_',
          '^DEFAULT_'
        ]
      }],
      
      // Require consistent function naming (camelCase) - relaxed
      'func-names': ['warn', 'as-needed'],
      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
      
      // Enforce design token usage patterns
      'prefer-const': 'warn',
      'no-var': 'error',
      
      // ===== STANDARD ESLint RULES =====
      
      // Possible errors
      'no-console': 'warn', // Allow console but warn
      'no-debugger': 'error',
      'no-alert': 'warn', // Allow alerts but warn (used for confirmations)
      'no-unused-vars': ['error', {
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_'
      }],
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'warn',
      
      // ES6+ features (relaxed for existing code)
      'arrow-body-style': ['warn', 'as-needed'],
      'arrow-parens': ['warn', 'as-needed'],
      'arrow-spacing': 'error',
      'constructor-super': 'error',
      'no-class-assign': 'error',
      'no-const-assign': 'error',
      'no-dupe-class-members': 'error',
      'no-duplicate-imports': 'error',
      'no-new-symbol': 'error',
      'no-this-before-super': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': ['warn', 'always'],
      'prefer-arrow-callback': 'warn',
      'prefer-destructuring': ['warn', {
        array: false,
        object: true
      }],
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      'prefer-template': 'warn',
      'rest-spread-spacing': 'error',
      'template-curly-spacing': 'error',
      
      // Import plugin rules (relaxed for existing code)
      'import/no-unresolved': 'warn',
      'import/named': 'warn',
      'import/namespace': 'warn',
      'import/default': 'warn',
      'import/export': 'error',
      'import/no-duplicates': 'warn',
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'warn',
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }],
      
      // JSDoc plugin rules (for documentation enforcement)
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',
      'jsdoc/check-syntax': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/empty-tags': 'error',
      'jsdoc/no-undefined-types': 'error',
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/valid-types': 'error'
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs']
        }
      }
    }
  },
  {
    // Custom rule for hardcoded color detection
    plugins: {
      'custom': {
        rules: {
          'no-hardcoded-colors': {
            meta: {
              type: 'problem',
              docs: {
                description: 'Prevent hardcoded colors, enforce design token usage',
                category: 'Best Practices',
                recommended: true
              },
              fixable: null,
              schema: []
            },
            create(context) {
              // Patterns that indicate hardcoded colors
              const colorPatterns = [
                // Hex colors
                /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/,
                // RGB/RGBA colors
                /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i,
                // HSL/HSLA colors
                /hsla?\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?/i,
                // Named colors (common ones)
                /\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey)\b/i
              ];
              
              // Allowed patterns (design tokens)
              const allowedPatterns = [
                /var\(--color-/,
                /--color-/,
                /\$color-/,
                // Allow transparent and inherit
                /\b(transparent|inherit|initial|unset|currentColor)\b/i
              ];
              
              function checkForHardcodedColors(node, value) {
                if (typeof value !== 'string') return;
                
                // Skip if it's already using design tokens
                if (allowedPatterns.some(pattern => pattern.test(value))) {
                  return;
                }
                
                // Check for hardcoded color patterns
                colorPatterns.forEach(pattern => {
                  if (pattern.test(value)) {
                    context.report({
                      node,
                      message: `Hardcoded color detected: "${value}". Use design tokens instead (e.g., var(--color-primary)).`
                    });
                  }
                });
              }
              
              return {
                Literal(node) {
                  checkForHardcodedColors(node, node.value);
                },
                TemplateLiteral(node) {
                  node.quasis.forEach(quasi => {
                    checkForHardcodedColors(node, quasi.value.raw);
                  });
                },
                Property(node) {
                  if (node.key.name && node.key.name.toLowerCase().includes('color')) {
                    if (node.value.type === 'Literal') {
                      checkForHardcodedColors(node, node.value.value);
                    }
                  }
                }
              };
            }
          }
        }
      }
    },
    rules: {
      'custom/no-hardcoded-colors': 'error'
    }
  },
  {
    // Specific rules for test files
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
    rules: {
      'no-console': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off'
    }
  },
  {
    // Ignore patterns
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.min.js',
      'vite.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'playwright.config.js',
      'vitest.config.js'
    ]
  }
];