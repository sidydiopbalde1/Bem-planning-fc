import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const auth = NextAuth.default ?? NextAuth
const handler = auth(authOptions)

export { handler as GET, handler as POST }
