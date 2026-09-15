# Frontend integration notes

## Payments
The payments.html portal offers Venmo, PayPal, and credit/debit card previews.
All methods are deliberately disconnected: no recipient, link, credentials,
backend, transaction submission, or payment-success state exists.
Form fields are preview-only and are never saved or sent. The payment button is
disabled. Before enabling payments, supply business-approved payment destinations
and a hosted card-checkout provider,
confirm the account can accept service payments, and verify recipient, amount,
reference, and receipt behavior. Never put secret credentials in frontend code.
Do not treat returning from Venmo as proof of payment or booking confirmation.

## Upcoming public events
Edit events-data.mjs with confirmed public events only, then rebuild and publish.
Supply title, start and end timestamps with Minnesota's correct UTC offset,
venue, full address, and optional details. Dates sort chronologically and expired
events disappear on page load. Directions use the supplied venue and address.
No example events are published. Private customer bookings must not be listed.
This is a code-managed list, not an admin dashboard or live Facebook integration.
