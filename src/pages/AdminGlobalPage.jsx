import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function AdminGlobalPage() {
  const [users, setUsers] = useState([])
  const [reservations, setReservations] = useState([])
  const [form, setForm] = useState({ nom: '', ville: '', adresse: '', capacite_stock: 0 })

  useEffect(() => {
    supabase.from('users').select('id,email,role,mosquee_id').then(({ data }) => setUsers(data ?? []))
    supabase
      .from('reservations')
      .select('prix_total,quantite,statut_paiement,mosquee_id')
      .then(({ data }) => setReservations(data ?? []))
  }, [])

  const stats = useMemo(() => {
    const paid = reservations.filter((r) => r.statut_paiement === 'paye')
    return {
      ca: paid.reduce((sum, r) => sum + Number(r.prix_total), 0),
      agneaux: paid.reduce((sum, r) => sum + Number(r.quantite), 0),
      echecs: reservations.filter((r) => r.statut_paiement === 'echoue').length,
    }
  }, [reservations])

  const createMosquee = async (event) => {
    event.preventDefault()
    await supabase.from('mosquees').insert(form)
    setForm({ nom: '', ville: '', adresse: '', capacite_stock: 0 })
  }

  return (
    <div className="space-y-4">
      <h1 className="title-gradient text-3xl">Dashboard admin global</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-[#305547]">Chiffre d&apos;affaires</p>
          <p className="mt-1 text-2xl font-semibold">{stats.ca} EUR</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-[#305547]">Agneaux vendus</p>
          <p className="mt-1 text-2xl font-semibold">{stats.agneaux}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-[#305547]">Paiements echoues</p>
          <p className="mt-1 text-2xl font-semibold">{stats.echecs}</p>
        </div>
      </div>

      <form onSubmit={createMosquee} className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-2xl text-[#0f3d2e]">Ajouter une mosquee</h2>
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          placeholder="Nom"
          value={form.nom}
          onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
        />
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          placeholder="Ville"
          value={form.ville}
          onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))}
        />
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          placeholder="Adresse"
          value={form.adresse}
          onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
        />
        <input
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 px-4 py-3 outline-none transition focus:border-[#c8a752]"
          type="number"
          placeholder="Capacite"
          value={form.capacite_stock}
          onChange={(e) => setForm((p) => ({ ...p, capacite_stock: Number(e.target.value) }))}
        />
        <button className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]">
          Creer
        </button>
      </form>

      <div className="glass rounded-3xl p-5">
        <h2 className="mb-2 text-2xl text-[#0f3d2e]">Gestion des roles</h2>
        <p className="mb-3 text-sm text-[#305547]">Attribue les roles directement dans la table users (RLS admin global).</p>
        {users.slice(0, 8).map((u) => (
          <p key={u.id} className="mb-1 rounded-lg border border-[#d7ceb9] bg-white/70 px-3 py-2 text-sm">
            {u.email} - <span className="font-medium">{u.role}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
