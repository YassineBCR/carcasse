import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import { UNIT_PRICE } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'

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
        throw new Error('Impossible de creer la session Stripe')
      }

      const payload = await response.json()
      const stripe = await stripePromise
      await stripe.redirectToCheckout({ sessionId: payload.sessionId })
    } catch (err) {
      setError(err.message ?? 'Erreur de reservation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass space-y-5 rounded-3xl p-6 sm:p-8">
      <h1 className="title-gradient text-3xl">Reservation</h1>
      <label className="block">
        <span className="text-sm font-semibold uppercase tracking-wide text-[#305547]">Mosquee de retrait</span>
        <select
          className="mt-2 w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
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
      <label className="block">
        <span className="text-sm font-semibold uppercase tracking-wide text-[#305547]">Quantite</span>
        <input
          className="mt-2 w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          type="number"
          min={1}
          value={form.quantite}
          onChange={(e) => updateQuantite(e.target.value)}
        />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-[#305547]">Noms pour le sacrifice</span>
        {form.noms.map((nom, index) => (
          <input
            key={index}
            className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
            placeholder={`Nom ${index + 1}`}
            value={nom}
            onChange={(e) => updateNom(index, e.target.value)}
          />
        ))}
      </div>
      <div className="rounded-2xl border border-[#c8a752]/30 bg-[#efe4ca] p-4 text-lg font-semibold text-[#234f3f]">
        Total: {total.toLocaleString('fr-FR')} EUR
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        onClick={checkout}
        disabled={loading || !form.mosquee_id}
        className="w-full rounded-xl bg-[#0f3d2e] px-4 py-3 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936] disabled:opacity-60"
      >
        {loading ? 'Preparation du paiement...' : 'Payer avec Stripe'}
      </button>
    </div>
  )
}
