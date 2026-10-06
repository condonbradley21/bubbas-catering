# Orders and staff access

The Worker serves the original website and protected /staff.html. Sites sign-in
starts via the dispatcher-owned /signin-with-chatgpt route. Every staff API checks
the forwarded identity AND STAFF_EMAILS (default: condonbradley21@gmail.com).
The current Site is owner-private. Customer access requires the owner to explicitly
change Site sharing later. Publishing this feature preserves that audience.

Requests are stored in D1 before the browser submits the existing FormSubmit form.
IDs are server-generated UUIDs, and a request key prevents duplicate records after
network retries. Email uses bubbasbbqpit@gmail.com with the ID in its subject/body.
The business must activate that address with FormSubmit; delivery is unverified.
If customers abandon the spam-check/email step, the saved order still remains in
the dashboard. No inbox-delivery status is fabricated. Without JavaScript, the
form can email an untracked inquiry, as disclosed beside the form.
Earlier inquiries are not imported. ZIP/date requests now continue to the saved
event request form. Order status and audit history are durable server records.

# Payment connections and refunds

No merchant credentials were supplied, and checkout remains disabled. No real
payment or refund was attempted. Provider calls have been tested with mocked
responses. Support exists for full refunds of individually linked Stripe payment
intents and PayPal captures. Stripe handles card transactions; wallets and other
payment methods require a separate hosted-checkout setup and merchant eligibility.

Configure hosted secrets STRIPE_SECRET_KEY and/or PAYPAL_CLIENT_ID,
PAYPAL_CLIENT_SECRET, PAYPAL_ENV (sandbox default; set live for production).
Never put credentials in the public page or .openai/hosting.json.
Complete provider sandbox validation before adding live secrets.

Staff link only provider-verified completed USD payments. Stripe metadata
order_id or PayPal custom_id/invoice_id must match the saved order ID. Payment
amounts come from the provider; duplicate transaction linkage is blocked.
Each refund requires a cancelled order, re-verification of its payment, and an
explicit amount/provider/order confirmation. A conditional durable claim plus
provider idempotency key prevents repeated/concurrent refunds. Refund success is
shown only after the provider reports success. Pending refunds can be checked.
An ambiguous result becomes review_required and blocks a second request. Staff
must inspect the original provider account; there is no automatic unlock/retry.
Partial refunds and automatic checkout capture are outside this change.

# Validation

node build.mjs
node --test orders-test.mjs
node scheduling-test.mjs

Tests use an isolated in-memory SQLite database, not customer data. Cases cover
authorization, persistence, request retries, form validation, cancellation,
provider references, concurrent refund submission and ambiguous provider errors.
