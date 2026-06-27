# Ruteen

A personal productivity web app for managing daily routines, tasks, and finances in one place.

Live: [productivity-app-delta-olive.vercel.app](https://productivity-app-delta-olive.vercel.app)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel

## Features

### Task Management
- Daily task list with date navigation
- Subtasks per task
- Task statuses: pending, done, failed
- Calendar view showing task activity per day
- Daily / Weekly / Monthly summary views
- Streak counter tracking consecutive days of full task completion
- Failed task log grouped by week

### Finance
- Multi-account support with IDR and USD currencies
- Transaction types: Income, Expense, Transfer, and custom user-defined types (e.g. Trading)
- Income/expense categories and subcategories, fully user-managed
- Transfer transactions with optional transfer fee (counted as expense)
- Cross-currency transfers with automatic exchange rate calculation
- Custom transaction types with +/- gain/loss toggle (for tracking trading P&L separately from living expenses)
- Customizable monthly period start day — useful if your salary arrives mid-month; automatically shifts to the previous Friday if the date falls on a weekend
- Privacy eye toggle — hides all amounts with •••••• across the entire finance section
- Summary views:
  - **Summary bar** — Total Equity, Income, Expense, Net Income with IDR/USD toggle and account balance tab
  - **Daily calendar** — color-coded cells (green/red/yellow) with net income per day
  - **Weekly** — bar chart comparing income vs expense per day, with weekly totals
  - **Monthly** — income, expense, net by currency; active days; top expense categories

### General
- Light and dark mode
- Responsive layout with sidebar (desktop) and bottom nav (mobile)
- Per-user data with Supabase Row Level Security

## Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
