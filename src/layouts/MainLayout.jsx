import { Link, useNavigate } from 'react-router-dom'
import { Crown, Truck, UserRound } from 'lucide-react'
import { ROLE_LABELS } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'

export function MainLayout({ children }) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      {/* Navbar flottante */}
      <header className="glass sticky top-4 z-50 mx-auto mb-10 max-w-6xl rounded-2xl transition-all duration-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="title-gradient text-2xl font-bold tracking-tight">
            Mon Bélier
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            {!user ? (
              <Link className="btn-primary rounded-xl px-5 py-2.5" to="/connexion">
                Connexion
              </Link>
            ) : (
              <>
                <span className="glass-panel hidden items-center gap-2 rounded-xl px-4 py-2 text-[#0f3d2e] sm:inline-flex shadow-sm">
                  <UserRound size={16} className="text-[#c8a752]" /> 
                  {ROLE_LABELS[role] ?? role}
                </span>
                
                {role === 'client' && (
                  <Link className="btn-primary rounded-xl px-5 py-2.5" to="/espace-client">
                    Espace client
                  </Link>
                )}
                {role === 'admin_mosquee' && (
                  <Link className="btn-primary rounded-xl px-5 py-2.5" to="/admin/mosquee">
                    Dashboard Mosquée
                  </Link>
                )}
                {role === 'livreur' && (
                  <Link className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5" to="/livreur">
                    <Truck size={16} /> Interface livreur
                  </Link>
                )}
                {role === 'admin_global' && (
                  <Link className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5" to="/admin/global">
                    <Crown size={16} /> Admin global
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-[#0f3d2e]/20 bg-white/50 px-5 py-2.5 text-[#0f3d2e] transition hover:bg-white hover:shadow-md"
                >
                  Déconnexion
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  )
}