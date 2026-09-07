# Deployment Checklist

## 1. Prepare the environment

Before deployment, create a production environment file or populate the host environment with the values from [.env.local.example](.env.local.example).

Required variables:
- `MONGODB_URI`
- `DB_NAME`
- `ADMIN_TOKEN_SECRET`
- `ADMIN_PASSWORD`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `EMERGENT_LLM_BASE_URL`
- `EMERGENT_LLM_KEY`
- `CHIPA_MODEL`
- `UPI_VPA`
- `UPI_PAYEE_NAME`

## 2. Build verification

Run locally before deploy:

```bash
npm install
npm run build
```

Expected result: successful production build with no fatal errors.

## 3. Vercel setup

1. Import the repository into Vercel.
2. Add all production environment variables under Project Settings → Environment Variables.
3. Confirm the project uses the Next.js framework.
4. Trigger a preview deployment.
5. After preview checks pass, promote to production.

## 4. Smoke tests after deployment

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://your-site.example/
curl -s -X POST https://your-site.example/api/admin/login -H 'Content-Type: application/json' -d '{"password":"admin123"}'
curl https://your-site.example/api/products
```

## 5. Post-deploy checks

- The homepage loads with HTTP 200.
- Product catalog loads successfully.
- Admin login works.
- Payment order creation works for Razorpay and UPI.
- No logs show 5xx errors.
- Webhooks are configured and reachable.

## 6. Rollback plan

- Revert to the previous successful production deployment in Vercel.
- Restore previous environment values if needed.
- Redeploy the last stable commit.
