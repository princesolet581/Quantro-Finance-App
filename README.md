# 💳 Full Stack Finance Platform

## 🌐 Overview
The **Full Stack Finance Platform** is a modern, responsive web application designed to help users record transactions, categorize expenses, and gain actionable financial insights. Developed with **Next.js**, **Shadcn UI**, and **Tailwind CSS**, this platform delivers a clean, mobile-first experience that makes financial management seamless and insightful.

Leveraging **Google Gemini AI** for intelligent expense categorization and trend detection, the app ensures that users can understand and optimize their spending patterns. Its robust backend uses **Prisma ORM** and **PostgreSQL** for seamless transaction recording, retrieval, and analytics.

**🌍 Live Demo**: [quantro-finance-app-tne4-5zc0f51ye-dungar-sonis-projects.vercel.app](https://quantro-finance-app-tne4-5zc0f51ye-dungar-sonis-projects.vercel.app/)

---

## ⚡️ Features
- ✅ Responsive, mobile-first design built with **Next.js**, **Shadcn UI**, and **Tailwind CSS**  
- ✅ User-friendly sign-in and role-based access control powered by **Clerk**  
- ✅ Intelligent expense categorization and trend detection using **Google Gemini AI**  
- ✅ Strong relational database schema and seamless transaction recording with **Prisma ORM** and **PostgreSQL**  
- ✅ Secured and rate-limited endpoints implemented using **Arcjet**  
- ✅ Automated background jobs and workflow orchestration using **Inngest**  
- ✅ CSV bank statement import with duplicate detection and automatic balance updates
- ✅ Category-level monthly budget planning with spending progress, alert thresholds, and rollover flags
- ✅ Recurring transaction automation with traceable generated transactions
- ✅ Bank reconciliation engine with match scoring and suggested review actions
- ✅ Financial reporting utilities for cashflow, account snapshots, CSV export, and anomaly detection
- ✅ Audit log and import batch history schema for production traceability
- ✅ Goal planning, debt payoff strategy comparison, transaction rules, and cashflow forecasting engines
- ✅ Focused Node test coverage for import parsing, budget calculations, and recurring schedules
- ✅ Deployed to **Vercel** for scalability, performance, and reliability  
- ✅ Tested REST APIs thoroughly using **Postman**

---

## Production Readiness Gap Analysis

### 1. Bank Statement Import and Reconciliation
Why it matters: Manual transaction entry does not scale for real users. Statement import reduces friction, improves data completeness, and gives users a practical way to reconcile account balances against their bank exports.

Difficulty: Medium

Affected files:
- `prisma/schema.prisma`
- `actions/transaction.js`
- `app/(main)/dashboard/page.jsx`
- `app/(main)/dashboard/_componenets/transaction-import-drawer.jsx`
- `lib/transaction-import.mjs`
- `tests/transaction-import.test.mjs`

Status: Implemented. Users can import CSV files with `date`, `description`, and `amount` columns, or `debit` and `credit` columns. The importer validates rows, skips duplicates, stores import metadata, and updates the account balance transactionally.

### 2. Multi-Budget Planning
Why it matters: A single default-account budget is too limited for production personal finance. Users need monthly budgets by category, rollover rules, alerts, and comparisons between planned and actual spending.

Difficulty: High

Affected files:
- `prisma/schema.prisma`
- `actions/budget.js`
- `app/(main)/dashboard/_componenets/budget-progress.jsx`
- `app/(main)/dashboard/_componenets/monthly-budget-planner.jsx`
- `app/(main)/dashboard/page.jsx`
- `lib/budget-planning.mjs`
- `lib/inngest/functions.js`
- `tests/budget-planning.test.mjs`

Status: Implemented. Users can create monthly budgets for expense categories, track spent and remaining amounts, set alert thresholds, mark rollover budgets, and remove plans.

### 3. Recurring Transaction Automation
Why it matters: The schema captures recurring settings, but production users expect scheduled transactions to be generated automatically, retried safely, and shown before they post.

Difficulty: Medium

Affected files:
- `prisma/schema.prisma`
- `actions/transaction.js`
- `lib/inngest/functions.js`
- `lib/recurring-transactions.mjs`
- `app/(main)/transaction/_components/transaction-form.jsx`
- `app/(main)/account/components/transaction-table.jsx`
- `tests/recurring-transactions.test.mjs`

Status: Implemented and hardened. Recurring schedule calculations now live in a tested shared helper, monthly recurrence calculation is fixed, and generated transactions keep a `recurringTemplateId` reference.

### 4. Financial Reports and Export
Why it matters: Users need monthly cashflow, category trends, net worth, tax-friendly exports, and CSV/PDF downloads to make the app useful beyond data entry.

Difficulty: Medium

Affected files:
- `actions/dashboard.js`
- `app/(main)/dashboard/_componenets/transaction-overview.jsx`
- `app/(main)/account/components/account-chart.jsx`
- `app/(main)/account/components/transaction-table.jsx`
- `data/category.js`
- `lib/financial-reporting.mjs`
- `tests/financial-reporting.test.mjs`

Status: Implemented as a tested reporting domain module. It builds cashflow summaries, account snapshots, category rankings, CSV transaction exports, and category anomaly detection.

### 5. Production Observability and Recovery
Why it matters: A production finance app needs audit logs, structured error tracking, failed-job visibility, and admin-safe recovery tools for imports, background jobs, email delivery, and AI receipt scanning.

Difficulty: High

Affected files:
- `prisma/schema.prisma`
- `actions/transaction.js`
- `actions/accounts.js`
- `actions/send-email.js`
- `app/api/inngest/route.js`
- `lib/inngest/functions.js`
- `lib/arcjet.js`
- `lib/audit-log.mjs`
- `tests/audit-log.test.mjs`

Status: Partially implemented. Import batches and audit events are modeled in Prisma, import attempts write history, and helper logic sanitizes audit metadata before storage.

### 6. Statement Reconciliation
Why it matters: Imported bank data often overlaps with manually entered transactions. A production finance app needs confidence scoring, duplicate prevention, and review queues so users can reconcile instead of creating duplicate transactions.

Difficulty: Medium

Affected files:
- `lib/reconciliation-engine.mjs`
- `tests/reconciliation-engine.test.mjs`
- `lib/transaction-import.mjs`
- `actions/transaction.js`

Status: Implemented as a tested reconciliation engine. It scores matches by type, amount, date, description, and category, then classifies records as auto-match, review, create, or keep.

---

## CSV Import Format

Open the dashboard and choose **Import CSV**. Select the account and upload a CSV file.

Required columns:
- `date`
- `description`
- `amount`

Alternative amount format:
- `debit`
- `credit`

Optional columns:
- `type` (`INCOME` or `EXPENSE`)
- `category`
- `id`
- `source`

Example:

```csv
date,description,amount,category
2025-06-01,Grocery Store,-42.15,groceries
2025-06-02,Payroll,2500,salary
```

---

## Budget Planning

The dashboard includes a **Category Budget Plan** panel. Users can set a budget per expense category for the current month, define the percentage that should trigger attention, and mark categories as rollover-ready for future expansion. The server aggregates current-month expenses by category and returns a monthly plan summary with budgeted, spent, remaining, and alert counts.

Database support is provided by the `monthly_budgets` table and the Prisma `MonthlyBudget` model.

---

## Recurring Transactions

Recurring transaction templates are processed by Inngest. When a template is due, the worker creates a normal completed transaction, updates account balance, records `lastProcessed`, calculates the next due date, and stores `recurringTemplateId` on the generated transaction for traceability.

---

## Reporting and Reconciliation

The app includes standalone domain modules for production workflows:

- `lib/reconciliation-engine.mjs` scores imported transactions against existing records and returns review-ready match decisions.
- `lib/financial-reporting.mjs` builds cashflow reports, category rankings, account snapshots, CSV exports, and spending anomaly detection.
- `lib/audit-log.mjs` builds sanitized audit events and import batch records for traceability.

These modules are intentionally framework-light so they can be tested independently and reused from server actions, background jobs, or future API routes.

---

## Planning Engines

Additional finance planning modules provide original business logic beyond basic CRUD:

- `lib/goal-planning.mjs` calculates savings goal progress, projected completion dates, deadline risk, and goal priority.
- `lib/debt-payoff.mjs` simulates avalanche and snowball debt payoff schedules and compares interest impact.
- `lib/transaction-rules.mjs` scores and applies automatic categorization rules to imported or manually entered transactions.
- `lib/cashflow-forecast.mjs` builds monthly baselines, forecasts future balances, and applies what-if scenario adjustments.

These are covered by dedicated tests and can be wired into future dashboard views or API routes.

---

## Testing

Run the focused test suite:

```bash
npm test
```

Current coverage includes:
- CSV transaction import parsing and duplicate keys
- Monthly budget usage calculations
- Recurring transaction scheduling and generated transaction data
- Bank reconciliation match scoring
- Financial reporting and CSV export
- Audit log and import history helpers
- Savings goal planning
- Debt payoff simulations
- Automatic transaction rules
- Cashflow forecasting scenarios

---

## 🛠️ Technologies and Tools

### 👇 Framework & Libraries
- **Next.js** — Server-side rendering and app directory architecture  
- **Shadcn UI** — Tailwind-based component library for sleek, modern interfaces  
- **Tailwind CSS** — Responsive design and layout

### 🔐 Authentication & Security
- **Clerk** — User sign-in, sign-up, and role-based access control  
- **Arcjet** — Rate limiting and protection for APIs  

### 🗄️ Database & ORM
- **PostgreSQL** — Relational database for transaction recording and analytics  
- **Prisma ORM** — Type-safe data access and schema modeling  

### 🧠 Intelligent Services
- **Google Gemini AI** — Expense categorization and trend detection  

### ⚡️ Workflow & Automation
- **Inngest** — Automated background jobs for processing and trend detection  

### ☁️ Deployment & Testing
- **Vercel** — Production-ready deployment platform  
- **Postman** — API testing and debugging

---

## 📁 Project Structure
app/
components/
lib/
prisma/
public/
styles/
.env
next.config.js
tailwind.config.js
postman_collection.json
README.md



---

## ✅ Getting Started

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/full-stack-finance-platform.git
cd full-stack-finance-platform
npm install
npm run dev





