"use client"

import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  const hasRole = (role) => session?.user?.role === role
  const isAdmin = () => hasRole("ADMIN")
  const isCoordinator = () => hasRole("COORDINATOR") || isAdmin()

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    hasRole,
    isAdmin,
    isCoordinator,
  }
}
