import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.accessToken = jwt.sign(
          { sub: user.id, email: user.email, role: user.role },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: "30d" }
        )
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.accessToken = token.accessToken
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
