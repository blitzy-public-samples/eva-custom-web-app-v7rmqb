// vite.config.ts
// External dependencies:
// vite: ^4.3.0
// @vitejs/plugin-react: ^4.0.0
// path: node:path

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // React plugin configuration with Fast Refresh and Emotion support
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: 'automatic',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],

  // Path resolution and aliases for clean imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    // API proxy configuration for local development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    cors: true,
    hmr: {
      overlay: true
    }
  },

  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // Rollup-specific optimizations
    rollupOptions: {
      output: {
        // Strategic code splitting for optimal loading performance
        manualChunks: {
          // Core vendor dependencies
          vendor: ['react', 'react-dom', '@mui/material'],
          // Authentication module
          auth: ['@auth0/auth0-react'],
          // State management
          state: ['@reduxjs/toolkit', 'react-redux'],
          // Data fetching
          query: ['@tanstack/react-query'],
          // Form handling
          forms: ['react-hook-form', 'yup'],
          // Utility libraries
          utils: ['date-fns', 'lodash']
        }
      }
    }
  },

  // Preview server configuration (for production builds)
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
    cors: true
  },

  // Dependency optimization configuration
  optimizeDeps: {
    // Pre-bundle these dependencies for faster development startup
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      'react-hook-form',
      'yup',
      'date-fns',
      'lodash'
    ],
    // Exclude Auth0 from pre-bundling due to its side effects
    exclude: ['@auth0/auth0-react']
  },

  // Environment variable handling
  envPrefix: 'VITE_',
  
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext'
  }
});