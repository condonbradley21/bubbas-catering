# Bubba’s Assistant demo

The website provides a guided demo at assistant.html, with illustrative menu
prices, a deterministic integer-cent calculator, and event questions. Natural conversation uses the Responses API with gpt-4.1-mini, strict structured
item IDs/quantities, and hosted menu/event data. Keyword matching is the fallback.
No invented events are posted. Each side is an individual portion. Tax, delivery,
staffing, and other fees are excluded rather than silently priced at zero.
No checkout, real booking, or business email is triggered by this demo.

## Hosted demo setup

The demo database is deployed in the Starlight Systems organization as Bubba’s
Demo (project alpytrayicycyhamtuvk). The guided service is deployed and connected
through assistant-config.mjs. Its public anonymous gateway key may be included
in the browser; private tables remain inaccessible to that role. JWT verification
is enabled at the function gateway. Server service credentials remain hosted.
OPENAI_API_KEY is stored only in Supabase Edge Function Secrets. Live verification
currently encounters provider quota errors; successful AI estimates remain pending.

### Reproducing the deployment

Connect Supabase and select/create a demo project, then apply the checked-in
supabase/migrations/202610060001_demo_assistant.sql. This creates separate demo
menu, event, and practice-request tables without altering production orders.
It enables RLS, denies direct anonymous/customer access, and grants only backend
service access. The function enforces allowed origins, bounded inputs, database
request limits, server-side totals, and idempotent practice-order creation.

Deploy supabase/functions/bubbas-assistant/index.ts with its dependency
demo-menu.mjs. Keep SUPABASE_SERVICE_ROLE_KEY on the backend only. Configure
ALLOWED_ORIGINS to the website origin. Set assistant-config.mjs endpoint to the
actual deployed HTTPS function URL; it is a public URL, never a secret.
For a new environment, complete these steps before saving is enabled. The
frontend falls back to a clearly labeled guided demo and
disables saving when the endpoint is missing or inaccessible.

Configure OPENAI_API_KEY in hosted Edge Function Secrets. It is never included in
browser code or GitHub. Requests use store:false and bounded output. Only the
visitor message, current selected items, public menu and confirmed events are
sent to OpenAI; practice customer details are not. Estimates use server prices,
not model totals. API failures return a clearly labeled guided fallback. Chat
has no booking/payment/database-write tools. Customers need no provider login.
Existing database limits cap calls at 60 per IP/hour and 500 globally/hour.
These limits reduce abuse but are not a monthly billing cap.

## Migration

Supabase uses PostgreSQL, so demo menu/request tables can later be moved to a
PostgreSQL database on AWS. The backend hosting and environment configuration
must be adapted separately; changing frontend hosting does not migrate records.
These demo requests intentionally do not appear in the current D1 staff portal.

## Checks

node build.mjs
node --test assistant-test.mjs orders-test.mjs
node scheduling-test.mjs
