import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { signIn, signUp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
  })

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        await signUp(form)
      } else {
        await signIn(form)
      }
      navigate('/espace-client')
    } catch (err) {
      setError(err.message ?? 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a752]/20 text-2xl">
            🐑
          </div>
          <h1 className="title-gradient text-3xl mb-2">{isSignup ? 'Créer un compte' : 'Bon retour'}</h1>
          <p className="text-sm text-[#305547]">
            {isSignup ? 'Rejoignez-nous pour réserver' : 'Connectez-vous à votre espace personnel'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-6 rounded-xl border border-amber-600/30 bg-amber-500/10 p-4 text-sm text-amber-900 text-center">
            Supabase n&apos;est pas configuré. Renseignez `.env`.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <div className="grid grid-cols-2 gap-4">
              <input
                className="glass-input w-full rounded-xl px-4 py-3.5 outline-none placeholder:text-[#0f3d2e]/50"
                name="prenom"
                placeholder="Prénom"
                onChange={onChange}
                value={form.prenom}
              />
              <input
                className="glass-input w-full rounded-xl px-4 py-3.5 outline-none placeholder:text-[#0f3d2e]/50"
                name="nom"
                placeholder="Nom"
                onChange={onChange}
                value={form.nom}
              />
            </div>
          )}
          
          <input
            className="glass-input w-full rounded-xl px-4 py-3.5 outline-none placeholder:text-[#0f3d2e]/50"
            name="email"
            type="email"
            placeholder="Adresse e-mail"
            onChange={onChange}
            value={form.email}
            required
          />
          <input
            className="glass-input w-full rounded-xl px-4 py-3.5 outline-none placeholder:text-[#0f3d2e]/50"
            name="password"
            type="password"
            placeholder="Mot de passe"
            onChange={onChange}
            value={form.password}
            required
          />

          {isSignup && (
            <input
              className="glass-input w-full rounded-xl px-4 py-3.5 outline-none placeholder:text-[#0f3d2e]/50"
              name="telephone"
              placeholder="Numéro de téléphone"
              onChange={onChange}
              value={form.telephone}
            />
          )}

          {error && <p className="text-sm font-medium text-red-500 text-center">{error}</p>}
          
          <button
            disabled={loading || !isSupabaseConfigured}
            className="btn-primary mt-2 w-full rounded-xl px-4 py-4 font-bold tracking-wide"
          >
            {loading ? 'Traitement...' : isSignup ? 'M\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignup((v) => !v)}
            className="text-sm font-medium text-[#0f3d2e] hover:text-[#c8a752] transition-colors"
          >
            {isSignup ? 'Déjà inscrit ? Connectez-vous' : 'Nouveau client ? Créez un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}