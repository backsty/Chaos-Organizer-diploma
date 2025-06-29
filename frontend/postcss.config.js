export default {
  plugins: {
    'postcss-preset-env': {
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
        'media-query-ranges': true
      },
      autoprefixer: {
        grid: 'autoplace'
      }
    },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true
            },
            normalizeWhitespace: false,
            minifySelectors: true,
            minifyParams: true
          }
        ]
      }
    } : {})
  }
};