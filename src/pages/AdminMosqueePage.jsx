import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function AdminMosqueePage() {
  const { profile } = useAuth()
  const [reservations, setReservations] = useState([])
  const [horaire, setHoraire] = useState('')

  useEffect(() => {
    if (!profile?.mosquee_id) return
    supabase
      .from('mosquees')
      .select('horaires_retrait')
      .eq('id', profile.mosquee_id)
      .single()
      .then(({ data }) => setHoraire(data?.horaires_retrait ?? ''))

    supabase
      .from('reservations')
      .select('id,code_retrait,statut_livraison,users(nom,prenom,telephone)')
      .eq('mosquee_id', profile.mosquee_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReservations(data ?? []))
  }, [profile?.mosquee_id])

  const saveHoraire = async () => {
    await supabase.from('mosquees').update({ horaires_retrait: horaire }).eq('id', profile.mosquee_id)
  }

  const markAsRemis = async (id) => {
    await supabase.from('reservations').update({ statut_livraison: 'remis' }).eq('id', id)
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, statut_livraison: 'remis' } : r)),
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="title-gradient text-3xl">Dashboard admin mosquee</h1>
      <div className="glass rounded-3xl p-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#305547]">Horaires de retrait</p>
        <textarea
          className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 p-3 outline-none transition focus:border-[#c8a752]"
          rows={3}
          value={horaire}
          onChange={(e) => setHoraire(e.target.value)}
        />
        <button
          onClick={saveHoraire}
          className="mt-3 rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
        >
          Enregistrer
        </button>
      </div>
      <div className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-2xl text-[#0f3d2e]">Clients attendus</h2>
        {reservations.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d7ceb9] bg-white/70 p-3"
          >
            <div>
              <p className="font-medium">
                {r.users?.prenom} {r.users?.nom}
              </p>
              <p className="text-sm text-[#305547]">Code: {r.code_retrait}</p>
              <p className="text-sm text-[#305547]">Statut: {r.statut_livraison}</p>
            </div>
            <button
              onClick={() => markAsRemis(r.id)}
              className="rounded-xl bg-[#c8a752] px-4 py-2.5 font-medium text-[#112f24] transition hover:bg-[#b89542]"
            >
              Valider remise
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
