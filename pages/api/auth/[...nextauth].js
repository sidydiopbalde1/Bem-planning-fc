// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';





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


// Extraire la configuration dans une constante exportée
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = jwt.sign(
          { sub: user.id, email: user.email, role: user.role },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: '30d' }
        );
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
export default NextAuth(authOptions);
