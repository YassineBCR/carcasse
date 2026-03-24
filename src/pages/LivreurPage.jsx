import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function LivreurPage() {
  const { user } = useAuth()
  const [livraisons, setLivraisons] = useState([])

  useEffect(() => {
    supabase
      .from('livraisons')
      .select('id,statut,quantite_attendue,mosquees(nom,ville)')
      .eq('livreur_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLivraisons(data ?? []))
  }, [user.id])

  const updateStatus = async (id, statut) => {
    await supabase.from('livraisons').update({ statut }).eq('id', id)
    setLivraisons((prev) => prev.map((item) => (item.id === id ? { ...item, statut } : item)))
  }

  return (
    <div className="space-y-4">
      <h1 className="title-gradient text-3xl">Interface livreur</h1>
      {livraisons.map((l) => (
        <div key={l.id} className="glass rounded-3xl p-5">
          <p className="text-lg font-semibold">{l.mosquees?.nom}</p>
          <p className="text-sm text-[#305547]">{l.mosquees?.ville}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-[#d7ceb9] bg-white/70 px-3 py-1">Quantite: {l.quantite_attendue}</span>
            <span className="rounded-full border border-[#d7ceb9] bg-white/70 px-3 py-1">Statut: {l.statut}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => updateStatus(l.id, 'en_route')}
              className="rounded-xl bg-[#0f3d2e] px-4 py-2.5 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
            >
              En route
            </button>
            <button
              onClick={() => updateStatus(l.id, 'livree')}
              className="rounded-xl bg-[#c8a752] px-4 py-2.5 font-medium text-[#112f24] transition hover:bg-[#b89542]"
            >
              Livraison terminee
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
