# Event inquiry delivery

inquiry.html first saves a server-backed order request, then submits a native HTTPS
POST to FormSubmit for bubbasbbqpit@gmail.com, including its order ID. See
ORDER-PORTAL-NOTES.md for current behavior, staff access, and deployment constraints.
The recipient must activate the form using the confirmation email triggered by
the first submission. Inbox delivery is unverified until activation and a test
submission are confirmed by the owner. No test inquiry was sent by the agent.

All customer fields have names; the email field supplies the customer reply address.
FormSubmit's default reCAPTCHA remains enabled. Its submission/confirmation page
handles the result. There is no local success page that claims inbox delivery.
The form works without JavaScript; JavaScript adds whitespace validation and
duplicate-click protection. Browser Back restores the Send button.

FormSubmit processes the contact/event details; this is disclosed next to Send.
No credentials, card information, local storage, or email-app handoff is involved.
To change recipients, update the action and visible address in inquiry.html, plus
the form-action assertion and mailto allowlist in build.mjs, and activate the new
recipient with FormSubmit. See https://formsubmit.co/ for setup documentation.
