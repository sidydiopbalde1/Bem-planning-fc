// lib/session.js
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export function getServerAuthSession() {
  return getServerSession(authOptions)
}
