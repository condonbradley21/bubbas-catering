// Native POST sends to FormSubmit, which emails the verified recipient.
// Keep reCAPTCHA enabled. No customer details are saved in browser storage.
const form = document.getElementById('inquiry-form');
const button = document.getElementById('send-inquiry');
const status = document.getElementById('inquiry-status');
form.addEventListener('submit', event => {
  for (const id of ['customer-name', 'customer-phone', 'event-location', 'event-message']) {
    const field = document.getElementById(id);
    field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
  }
  if (!form.reportValidity()) { event.preventDefault(); return; }
  button.disabled = true;
  button.textContent = 'Continuing to submission…';
  status.textContent = 'Please complete any spam check on the next page. Your inquiry has not yet been confirmed.';
});
form.addEventListener('input', event => {
  if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
});
window.addEventListener('pageshow', () => {
  button.disabled = false;
  button.textContent = 'Send inquiry ↗';
  status.textContent = '';
});
