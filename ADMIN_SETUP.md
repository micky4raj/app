# Admin Setup

This project expects a few environment variables before it can run properly.

## Required environment variables

Copy [.env.local.example](.env.local.example) to `.env.local` and fill in the real values for your environment.

### Core app
- `MONGODB_URI` — MongoDB connection string
- `DB_NAME` — Database name to use

### Admin auth
- `ADMIN_TOKEN_SECRET` — secret used for admin API protection
- `ADMIN_PASSWORD` — password for the admin login screen

### Payments
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### AI / session auth
- `EMERGENT_LLM_BASE_URL`
- `EMERGENT_LLM_KEY`
- `CHIPA_MODEL`

### UPI
- `UPI_VPA`
- `UPI_PAYEE_NAME`

## Quick checks

### Health
```bash
curl http://localhost:3000/api/health
```

### Admin login
```bash
curl -s -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"admin123"}'
```

### Product catalog
```bash
curl http://localhost:3000/api/products
```

## Notes
- Do not commit `.env.local`.
- Keep admin credentials out of source control.
- In production, set the same variables in the host environment (Vercel/Render/etc.).
