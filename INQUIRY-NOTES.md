# Event inquiry

The homepage's “Talk about your event” link opens inquiry.html.
The recipient is condonbradley21@gmail.com. Change inquiryRecipient in inquiry.mjs
and the visible recipient/fallback links in inquiry.html together.

This static frontend composes a mailto email. It does NOT automatically forward,
store, queue, or deliver inquiries. Customers must review and send in their email
app. A copyable fallback handles unavailable email apps or mailto length limits.
No real test email was sent.

For automatic delivery, connect an approved form/email provider or server endpoint
with server-side validation, spam protection and credentials stored as secrets.
Only show delivery success after the service confirms acceptance.
