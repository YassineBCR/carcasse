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
    <div className="glass mx-auto max-w-md rounded-3xl p-6 sm:p-7">
      <p className="mb-2 text-sm font-medium text-[#7a5f1a]">Mon Belier</p>
      <h1 className="title-gradient text-3xl">{isSignup ? 'Creer un compte' : 'Connexion'}</h1>
      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-xl border border-amber-600 bg-amber-100 p-3 text-sm text-amber-900">
          Supabase n&apos;est pas configure. Renseigne `.env` puis redemarre le serveur.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          name="email"
          type="email"
          placeholder="Email"
          onChange={onChange}
          value={form.email}
          required
        />
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          name="password"
          type="password"
          placeholder="Mot de passe"
          onChange={onChange}
          value={form.password}
          required
        />
        {isSignup && (
          <>
            <input
              className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
              name="nom"
              placeholder="Nom"
              onChange={onChange}
              value={form.nom}
            />
            <input
              className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
              name="prenom"
              placeholder="Prenom"
              onChange={onChange}
              value={form.prenom}
            />
            <input
              className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
              name="telephone"
              placeholder="Telephone"
              onChange={onChange}
              value={form.telephone}
            />
          </>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={loading || !isSupabaseConfigured}
          className="w-full rounded-xl bg-[#0f3d2e] px-4 py-3 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936] disabled:opacity-60"
        >
          {loading ? 'Traitement...' : isSignup ? 'Inscription' : 'Se connecter'}
        </button>
      </form>
      <button
        onClick={() => setIsSignup((v) => !v)}
        className="mt-4 text-sm font-medium text-[#0f3d2e] underline underline-offset-4"
      >
        {isSignup ? 'Deja inscrit ? Connexion' : 'Nouveau client ? Inscription'}
      </button>
    </div>
  )
}
