import compiler from '@ampproject/rollup-plugin-closure-compiler';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
  },
  plugins: [
    compiler(),
  ],
}