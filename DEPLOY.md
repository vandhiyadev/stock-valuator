# Stock Valuator - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Turso database (already created!)

### Step 1: Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/stock-valuator.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub → Select `stock-valuator`
4. Configure the following environment variables:

### Step 3: Environment Variables for Vercel

Add these in Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `libsql://stock-valuator-vandhiyadev.aws-ap-south-1.turso.io?authToken=YOUR_TOKEN` |
| `NEXTAUTH_SECRET` | (Generate with: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### Your Turso Database Info

- **URL:** `libsql://stock-valuator-vandhiyadev.aws-ap-south-1.turso.io`
- **Location:** Mumbai (aws-ap-south-1)
- **Token:** (Saved in Turso CLI - run `turso db tokens create stock-valuator`)

### Step 4: Update Prisma for Production

Before deploying, add Turso driver to prisma schema:

```prisma
// At the top of prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

Then install the Turso adapter:
```bash
npm install @libsql/client @prisma/adapter-libsql
```

### Step 5: Deploy

Click "Deploy" in Vercel. It will automatically:
1. Build the Next.js app
2. Deploy to Vercel's edge network
3. Connect to Turso database

### Post-Deployment

1. Update `NEXTAUTH_URL` to your actual Vercel URL
2. Run database migrations:
   ```bash
   npx prisma db push
   ```

---

## 🔐 Admin Account

After deployment, create your admin account:

```bash
# Connect to Turso shell
turso db shell stock-valuator

# Create admin user (you'll need to hash password separately)
# Or use the signup form and then update tier in database:
UPDATE User SET tier = 'admin' WHERE email = 'youremail@example.com';
```

---

## 🛠 Local Development

```bash
# Use local SQLite
cp .env.example .env.local
# Edit .env.local with local DATABASE_URL

npm run dev
```
