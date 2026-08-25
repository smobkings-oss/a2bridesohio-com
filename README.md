# A2B Rides Ohio
Production Next.js booking and dispatch stack for a2bridesohio.com.

## Included
- Public marketing site
- Route-based fare estimates through Google Routes API
- Ride-request storage in Supabase
- Admin PIN/session and dispatch dashboard
- Fare lock before payment
- Stripe Checkout + signed webhook
- Driver applications + approve/reject workflow

## Production setup
1. Create the two Supabase tables using `supabase/schema.sql`.
2. Add every variable from `.env.example` to the deployment environment.
3. Create a Stripe webhook at `/api/payments/stripe/webhook` for `checkout.session.completed` and `checkout.session.expired`.
4. Deploy and test in Stripe sandbox before switching `STRIPE_SECRET_KEY` and webhook secret to live values.

Never commit secret keys to GitHub.
