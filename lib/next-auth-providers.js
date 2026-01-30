// lib/next-auth-providers.js
// Re-export next-auth modules for ESM/CJS interop in standalone mode
export { default as NextAuth } from 'next-auth';
export { default as CredentialsProvider } from 'next-auth/providers/credentials';
export { default as GoogleProvider } from 'next-auth/providers/google';
