# Bubba’s Assistant demo

The website provides a guided demo at assistant.html, with illustrative menu
prices, a deterministic integer-cent calculator, and event questions. It uses
keyword matching until the AI service is connected, and says so on the page.
No invented events are posted. Each side is an individual portion. Tax, delivery,
staffing, and other fees are excluded rather than silently priced at zero.
No checkout, real booking, or business email is triggered by this demo.

## Hosted demo setup

The demo database is deployed in the Starlight Systems organization as Bubba’s
Demo (project alpytrayicycyhamtuvk). The guided service is deployed and connected
through assistant-config.mjs. Its public anonymous gateway key may be included
in the browser; private tables remain inaccessible to that role. JWT verification
is enabled at the function gateway. Server service credentials remain hosted.
The API-backed AI conversation remains pending explicit API-key approval.

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

Connect OpenAI Developers to securely provision an approved API key and configure
it as a backend secret. No AI key has been supplied, no OpenAI request is made,
and natural-language AI behavior is not currently implemented. Finish the
Responses API integration for gpt-4.1-mini after that connection, using structured
item IDs/quantities and database-backed events. The server calculator must remain
authoritative for all prices. Test against sample customer questions before
enabling live chat. Customers should not need a provider account or login.

## Migration

Supabase uses PostgreSQL, so demo menu/request tables can later be moved to a
PostgreSQL database on AWS. The backend hosting and environment configuration
must be adapted separately; changing frontend hosting does not migrate records.
These demo requests intentionally do not appear in the current D1 staff portal.

## Checks

node build.mjs
node --test assistant-test.mjs orders-test.mjs
node scheduling-test.mjs
