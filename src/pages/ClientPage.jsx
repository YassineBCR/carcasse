import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function ClientPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [qr, setQr] = useState('')

  useEffect(() => {
    supabase
      .from('reservations')
      .select('id,quantite,prix_total,statut_paiement,statut_livraison,code_retrait,mosquees(nom,ville)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReservations(data ?? []))
  }, [user.id])

  const latest = useMemo(() => reservations[0], [reservations])

  useEffect(() => {
    if (!latest?.code_retrait) return
    QRCode.toDataURL(latest.code_retrait).then(setQr)
  }, [latest?.code_retrait])

  return (
    <div className="space-y-4">
      <h1 className="title-gradient text-3xl">Espace client</h1>
      {latest && (
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h2 className="mb-3 text-2xl text-[#0f3d2e]">Derniere commande</h2>
          <p className="mb-1">Statut paiement: {latest.statut_paiement}</p>
          <p className="mb-1">Statut retrait: {latest.statut_livraison}</p>
          <p className="mb-1">
            Mosquee: {latest.mosquees?.nom} ({latest.mosquees?.ville})
          </p>
          <p className="font-medium">Code retrait: {latest.code_retrait ?? 'A generer'}</p>
          {qr && <img src={qr} alt="QR code retrait" className="mt-4 max-w-[180px] rounded-lg border border-[#d7ceb9] bg-white p-2" />}
        </div>
      )}
      <div className="glass overflow-x-auto rounded-3xl p-4">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-[#305547]">
            <tr className="border-b border-[#d7ceb9]">
              <th className="py-2">ID</th>
              <th className="py-2">Quantite</th>
              <th className="py-2">Total</th>
              <th className="py-2">Paiement</th>
              <th className="py-2">Retrait</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-t border-[#d7ceb9]/70">
                <td className="py-2">{r.id.slice(0, 8)}</td>
                <td className="py-2">{r.quantite}</td>
                <td className="py-2">{r.prix_total} EUR</td>
                <td className="py-2">{r.statut_paiement}</td>
                <td className="py-2">{r.statut_livraison}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
