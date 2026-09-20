# A2B RIDES

Canonical production repository for A2B RIDES, a DBA of Anytime Anywhere Solutions LLC, at [a2bridesohio.com](https://a2bridesohio.com).

## Included

- Responsive public marketing site
- Route-based estimates through Google Routes API
- Ride-request storage and customer booking status in Supabase
- PIN-protected dispatch dashboard
- Dispatch-controlled final-fare locking
- Stripe Checkout with signed webhook confirmation, receipt links, and refund status
- Driver application and review workflow
- Privacy policy and service terms

## Production setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Deploy this repository as a Next.js application.
3. Add every variable from `.env.example` to the deployment environment.
4. Create a Stripe webhook at `https://a2bridesohio.com/api/payments/stripe/webhook` for `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, and `charge.refunded`.
5. Test the full flow with Stripe test keys before using live keys.
6. Point `a2bridesohio.com` to the deployment only after the temporary deployment URL passes testing.

After pulling a database-related update, rerun `supabase/schema.sql`; its additive migrations are safe to rerun. Card checkout remains unavailable until both Stripe secrets are present and the signed webhook is active. Never paste production secrets into chat or commit them to Git.

Never commit `.env` files, Supabase service-role keys, Stripe secret keys, webhook secrets, or the admin PIN.
