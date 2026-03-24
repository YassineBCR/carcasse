import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import { UNIT_PRICE } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, MapPin, Users } from 'lucide-react'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

export function ReservationPage() {
  const { user } = useAuth()
  const [mosquees, setMosquees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    mosquee_id: '',
    quantite: 1,
    noms: [''],
  })

  useEffect(() => {
    supabase.from('mosquees').select('id,nom,ville').then(({ data, error: e }) => {
      if (e) setError(e.message)
      setMosquees(data ?? [])
      if (data?.[0]) {
        setForm((prev) => ({ ...prev, mosquee_id: prev.mosquee_id || data[0].id }))
      }
    })
  }, [])

  const total = useMemo(() => Number(form.quantite) * UNIT_PRICE, [form.quantite])

  const updateQuantite = (value) => {
    const q = Math.max(1, Number(value || 1))
    setForm((prev) => {
      const noms = [...prev.noms]
      while (noms.length < q) noms.push('')
      return { ...prev, quantite: q, noms: noms.slice(0, q) }
    })
  }

  const updateNom = (index, value) => {
    setForm((prev) => {
      const noms = [...prev.noms]
      noms[index] = value
      return { ...prev, noms }
    })
  }

  const checkout = async () => {
    setLoading(true)
    setError('')
    try {
      const cleanNoms = form.noms.map((n) => n.trim()).filter(Boolean)
      if (cleanNoms.length !== Number(form.quantite)) {
        throw new Error('Un nom est requis pour chaque agneau')
      }
      const { data: reservation, error: reservationErr } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          mosquee_id: form.mosquee_id,
          quantite: Number(form.quantite),
          noms_sacrifice: cleanNoms,
          prix_total: total,
          statut_paiement: 'en_attente',
        })
        .select('id')
        .single()

      if (reservationErr) throw reservationErr

      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          quantity: Number(form.quantite),
        }),
      })

      if (!response.ok) {
        throw new Error('Impossible de créer la session Stripe')
      }

      const payload = await response.json()
      const stripe = await stripePromise
      await stripe.redirectToCheckout({ sessionId: payload.sessionId })
    } catch (err) {
      setError(err.message ?? 'Erreur de réservation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="glass-panel space-y-8 rounded-[2rem] p-8 sm:p-12">
        <div className="text-center">
          <h1 className="title-gradient text-4xl mb-2">Réservation</h1>
          <p className="text-[#305547]">Préparez votre commande en quelques étapes</p>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
              <MapPin size={16} className="text-[#c8a752]" /> Point de retrait
            </span>
            <select
              className="glass-input w-full rounded-2xl px-5 py-4 text-lg text-[#0f3d2e] cursor-pointer"
              value={form.mosquee_id}
              onChange={(e) => setForm((prev) => ({ ...prev, mosquee_id: e.target.value }))}
            >
              {mosquees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom} - {m.ville}
                </option>
              ))}
            </select>
          </label>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a752]/30 to-transparent"></div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
              <Users size={16} className="text-[#c8a752]" /> Quantité désirée
            </span>
            <input
              className="glass-input w-full rounded-2xl px-5 py-4 text-lg text-[#0f3d2e]"
              type="number"
              min={1}
              value={form.quantite}
              onChange={(e) => updateQuantite(e.target.value)}
            />
          </label>

          <div className="space-y-3 rounded-2xl bg-white/30 p-5 border border-white/40">
            <span className="mb-3 block text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
              Noms pour le sacrifice
            </span>
            {form.noms.map((nom, index) => (
              <input
                key={index}
                className="glass-input w-full rounded-xl px-4 py-3 text-md text-[#0f3d2e]"
                placeholder={`Nom de la personne n°${index + 1}`}
                value={nom}
                onChange={(e) => updateNom(index, e.target.value)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#0f3d2e] to-[#164936] p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-lg opacity-80">Total à régler</span>
            <span className="text-3xl font-bold text-[#c8a752]">{total.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={checkout}
          disabled={loading || !form.mosquee_id}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-bold uppercase tracking-wide"
        >
          <CreditCard size={20} />
          {loading ? 'Redirection sécurisée...' : 'Payer avec Stripe'}
        </button>
      </div>
    </div>
  )
}