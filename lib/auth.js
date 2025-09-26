// lib/auth.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function getServerAuthSession(req, res) {
  return await getServerSession(req, res, authOptions);
}

// Hook personnalisé pour vérifier les permissions
export function useAuth() {
  const { data: session, status } = useSession();
  
  const hasRole = (role) => {
    return session?.user?.role === role;
  };
  
  const isAdmin = () => hasRole('ADMIN');
  const isCoordinator = () => hasRole('COORDINATOR') || isAdmin();
  
  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    hasRole,
    isAdmin,
    isCoordinator,
  };
}