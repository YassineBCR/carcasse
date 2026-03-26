import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

dotenv.config()
dotenv.config({ path: 'server/.env', override: false })

const app = express()
const port = process.env.PORT || 8787

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

const requiredEnv = [
  'STRIPE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]
const missingEnv = requiredEnv.filter((name) => !process.env[name]).concat(!supabaseUrl ? ['SUPABASE_URL'] : [])
if (missingEnv.length > 0) {
  console.error(
    `Variables serveur manquantes dans .env: ${missingEnv.join(', ')}`
  )
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)

app.use(cors())

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const reservationId = session.metadata?.reservation_id
      if (reservationId) {
        await supabaseAdmin
          .from('reservations')
          .update({
            statut_paiement: 'paye',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq('id', reservationId)
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const reservationId = session.metadata?.reservation_id
      if (reservationId) {
        await supabaseAdmin.from('reservations').update({ statut_paiement: 'echoue' }).eq('id', reservationId)
      }
    }

    return res.json({ received: true })
  } catch (err) {
    console.error(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/create-checkout-session', async (req, res) => {
  try {
    // Récupération du customer_email envoyé depuis le frontend
    const { reservationId, quantity, customer_email } = req.body
    
    if (!reservationId || !quantity) {
      return res.status(400).json({ error: 'reservationId et quantity sont requis' })
    }
    
    const successUrl = `${frontendUrl}/espace-client?checkout=success`
    const cancelUrl = `${frontendUrl}/reservation?checkout=cancel`
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer_email || undefined, // Pré-remplit l'email sur Stripe
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'eur',
            unit_amount: 36000,
            product_data: {
              name: 'Reservation agneau - Mon Belier',
            },
          },
        },
      ],
      metadata: {
        reservation_id: reservationId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    await supabaseAdmin
      .from('reservations')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', reservationId)

    // Le backend renvoie explicitement l'URL pour la redirection
    return res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur creation Checkout session' })
  }
})

app.listen(port, () => {
  console.log(`API serveur active sur http://localhost:${port}`)
})