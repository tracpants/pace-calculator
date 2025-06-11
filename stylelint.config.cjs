module.exports = {
  extends: [
    'stylelint-config-standard'
  ],
  
  plugins: [
    'stylelint-order'
  ],
  
  // Configure for CSS files and CSS-in-JS
  overrides: [
    {
      files: ['**/*.css'],
      rules: {
        // Relax some rules for existing TailwindCSS setup
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'tailwind',
              'apply',
              'layer',
              'config',
              'variants',
              'responsive',
              'screen'
            ]
          }
        ]
      }
    }
  ],
  
  rules: {
    // ===== ESSENTIAL DESIGN TOKEN ENFORCEMENT =====
    
    // CSS Custom Properties (Design Tokens) Standards - flexible pattern
    'custom-property-pattern': [
      '^(color|surface|background|text|border|interactive|status)-[a-z0-9-]+$',
      {
        message: 'Design tokens should follow naming convention: --color-*, --surface-*, --background-*, --text-*, --border-*, --interactive-*, --status-*'
      }
    ],
    
    // ===== DISABLED RULES FOR EXISTING CODEBASE =====
    
    // Allow all at-rules (TailwindCSS compatibility)
    'at-rule-no-unknown': null,
    'at-rule-no-deprecated': null,
    
    // Allow all color formats in token definitions
    'color-no-hex': null,
    'color-hex-length': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-function-alias-notation': null,
    
    // Allow all function types
    'function-disallowed-list': null,
    
    // Disable formatting rules that conflict with existing code
    'declaration-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    
    // Allow vendor prefixes
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    
    // Allow important declarations
    'declaration-no-important': null,
    
    // Disable selector restrictions
    'selector-max-specificity': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'selector-not-notation': null,
    
    // Allow empty sources
    'no-empty-source': null,
    
    // Disable property ordering
    'order/properties-order': null,
    
    // Allow redundant values and longhand properties
    'shorthand-property-no-redundant-values': null,
    'declaration-block-no-redundant-longhand-properties': null,
    
    // Allow any keyframe naming
    'keyframes-name-pattern': null,
    
    // Allow modern CSS features without strict enforcement
    'media-feature-range-notation': null,
    
    // Allow font family naming flexibility
    'font-family-name-quotes': null,
    
    // ===== KEEP ESSENTIAL QUALITY RULES =====
    
    // Basic syntax validation
    'no-invalid-double-slash-comments': true,
    'property-no-unknown': true,
    'unit-no-unknown': true,
    'function-no-unknown': true,
    
    // Prevent obvious errors
    'block-no-empty': true,
    'no-empty-source': null, // Allow empty CSS files
    'color-no-invalid-hex': true,
    'string-no-newline': true,
    'declaration-block-no-duplicate-properties': true
  },
  
  // Ignore patterns
  ignoreFiles: [
    'dist/**/*.css',
    'node_modules/**/*.css',
    'coverage/**/*.css'
  ]
};