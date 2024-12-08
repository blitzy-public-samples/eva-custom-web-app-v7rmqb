// Human Tasks:
// 1. Verify environment variables are properly configured in deployment pipeline
// 2. Test build optimization settings across different environments
// 3. Ensure all plugins are compatible with current Vite version
// 4. Validate asset handling and bundling configuration

// vite version ^4.0.0
import { defineConfig } from 'vite';
// vite-plugin-env-compatible version ^1.0.0
import envCompatible from 'vite-plugin-env-compatible';
import { resolve } from 'path';

// Import configurations
import { palette } from './src/config/theme.config';
import { API_BASE_URL } from './src/config/api.config';
import type { ViteEnv } from './src/vite-env.d';

/**
 * Configures the Vite build tool with optimizations and environment settings
 * Addresses Frontend Build Optimization requirement from Technical Specifications/4.5 Development & Deployment/Deployment Pipeline
 */
export default defineConfig(({ mode }) => {
  // Environment variable configuration
  const env = process.env as unknown as ViteEnv;
  const apiBaseUrl = env.VITE_API_BASE_URL || API_BASE_URL;

  return {
    // Base configuration
    base: '/',
    
    // Development server configuration
    server: {
      port: 3000,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Build configuration
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
          },
        },
      },
      // Minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `$primary-color: ${palette.primary.main};`,
        },
      },
    },

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@config': resolve(__dirname, './src/config'),
        '@styles': resolve(__dirname, './src/styles'),
      },
    },

    // Plugin configuration
    plugins: [
      envCompatible({
        prefix: 'VITE_',
        mountedPath: 'process.env',
      }),
    ],

    // Optimization configuration
    optimizeDeps: {
      include: ['react', 'react-dom', '@mui/material'],
      exclude: ['@fsouza/prettierd'],
    },

    // Preview configuration
    preview: {
      port: 3000,
      host: true,
    },

    // Type checking
    esbuild: {
      jsxInject: `import React from 'react'`,
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },

    // Environment variables
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
  };
});