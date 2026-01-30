// pages/api/auth/[...nextauth].js
import * as _NextAuth from 'next-auth';
import * as _CredentialsProvider from 'next-auth/providers/credentials';
import * as _GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Fix ESM/CJS default export interop in standalone mode
const NextAuth = _NextAuth.default || _NextAuth;
const CredentialsProvider = _CredentialsProvider.default || _CredentialsProvider;
const GoogleProvider = _GoogleProvider.default || _GoogleProvider;

const prisma = new PrismaClient();

/**
 * Helper pour journaliser les événements d'authentification
 */
async function logAuthEvent(action, user, additionalInfo = {}) {
  try {
    await prisma.journalActivite.create({
      data: {
        action: action,
        entite: 'Authentification',
        entiteId: user?.id || 'unknown',
        description: additionalInfo.description || `${action} - ${user?.email || 'Utilisateur inconnu'}`,
        ancienneValeur: null,
        nouvelleValeur: JSON.stringify({
          email: user?.email,
          name: user?.name,
          role: user?.role,
          provider: additionalInfo.provider || 'credentials',
          timestamp: new Date().toISOString()
        }),
        userId: user?.id || 'system',
        userName: user?.name || user?.email || 'Système',
        ipAddress: additionalInfo.ipAddress || null,
        userAgent: additionalInfo.userAgent || null,
      }
    });
  } catch (error) {
    console.error('Erreur journalisation auth:', error);
  }
}

// Vérifier si Google OAuth est configuré
const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

// Extraire la configuration dans une constante exportée
export const authOptions = {
  // IMPORTANT: PrismaAdapter ne fonctionne pas avec CredentialsProvider seul
  // On l'utilise uniquement si Google OAuth est configuré
  ...(hasGoogleConfig && { adapter: PrismaAdapter(prisma) }),

  providers: [
    // Authentification par email/mot de passe
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('Utilisateur non trouvé');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Mot de passe incorrect');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),

    // Optionnel: Google OAuth (seulement si configuré)
    ...(hasGoogleConfig ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Générer un accessToken pour le backend NestJS
        token.accessToken = jwt.sign(
          { sub: user.id, email: user.email, role: user.role },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: '30d' }
        );
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  // Événements pour la journalisation
  events: {
    async signIn({ user, account, isNewUser }) {
      await logAuthEvent('CONNEXION', user, {
        description: `Connexion réussie - ${user?.email}`,
        provider: account?.provider || 'credentials',
      });
    },
    async signOut({ token }) {
      if (token) {
        await logAuthEvent('DECONNEXION', {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role
        }, {
          description: `Déconnexion - ${token.email}`,
        });
      }
    },
    async createUser({ user }) {
      await logAuthEvent('CREATION', user, {
        description: `Création de compte - ${user?.email}`,
      });
    },
    async linkAccount({ user, account }) {
      await logAuthEvent('MODIFICATION', user, {
        description: `Liaison de compte ${account?.provider} - ${user?.email}`,
        provider: account?.provider,
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

// Utiliser la configuration exportée
export default NextAuth(authOptions);