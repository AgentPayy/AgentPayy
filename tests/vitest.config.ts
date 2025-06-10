import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 10000,
    setupFiles: ['./setup.ts'],
    include: [
      'integration/**/*.test.ts',
      'unit/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/[.]**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    reporters: ['verbose', 'json'],
    outputFile: './test-results.json'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@contracts': path.resolve(__dirname, '../contracts'),
      '@sdk': path.resolve(__dirname, '../sdk'),
      '@gateway': path.resolve(__dirname, '../gateway'),
      '@cli': path.resolve(__dirname, '../cli'),
      '@packages': path.resolve(__dirname, '../packages')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test')
  }
}); 