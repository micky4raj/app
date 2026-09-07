# Label Jigyasa

A Next.js storefront for handcrafted Sanganer and Bagru block-print textiles.

## Features

- Product catalog with search, categories, and sorting
- Cart, wishlist, and checkout flows
- Razorpay and UPI payment options
- MongoDB-backed order and product APIs
- Admin dashboard for products and orders
- Emergent-session auth for storefront users

## Local setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in all required values.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Admin access

- Login route: `/admin`
- Default admin password: `admin123`
- Set `ADMIN_PASSWORD` in `.env.local` for production use.

## Project notes

- Use `.env.local` for local secrets only.
- Production settings should be configured in your host environment.
- The app expects MongoDB and payment credentials to be available in the environment.
