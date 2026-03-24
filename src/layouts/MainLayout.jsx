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
    <div className="min-h-screen px-3 pb-6 pt-3 sm:px-5">
      <header className="glass sticky top-3 z-20 mx-auto mb-6 max-w-6xl rounded-2xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="title-gradient text-xl font-semibold sm:text-2xl">
            Mon Belier
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {!user ? (
              <Link
                className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
                to="/connexion"
              >
                Connexion
              </Link>
            ) : (
              <>
                <span className="glass hidden items-center gap-2 rounded-xl px-3 py-2 text-[#0f3d2e] sm:inline-flex">
                  <UserRound size={14} /> {ROLE_LABELS[role] ?? role}
                </span>
                {role === 'client' && (
                  <Link
                    className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
                    to="/espace-client"
                  >
                    Espace client
                  </Link>
                )}
                {role === 'admin_mosquee' && (
                  <Link
                    className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
                    to="/admin/mosquee"
                  >
                    Dashboard mosquee
                  </Link>
                )}
                {role === 'livreur' && (
                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
                    to="/livreur"
                  >
                    <Truck size={14} />
                    Interface livreur
                  </Link>
                )}
                {role === 'admin_global' && (
                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
                    to="/admin/global"
                  >
                    <Crown size={14} />
                    Admin global
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-[#0f3d2e]/30 bg-white/60 px-4 py-2.5 text-[#0f3d2e] transition hover:bg-white/90"
                >
                  Deconnexion
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  )
}
