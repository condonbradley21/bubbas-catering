export const inquiryRecipient = 'condonbradley21@gmail.com';
export function createInquiry(data) {
  const value = key => String(data[key] ?? '').trim();
  const subject = 'Bubba’s event inquiry';
  const body = [
    'Name: ' + value('customer-name'), 'Phone: ' + value('customer-phone'),
    'Email: ' + value('customer-email'), '', 'Location: ' + value('event-location'),
    'Preferred date: ' + (value('event-date') || 'Not decided'),
    'Estimated guests: ' + (value('guest-count') || 'Not decided'),
    'Event type: ' + value('event-type'), '', 'What I’m looking for:',
    value('event-message')
  ].join('\r\n');
  return {body, subject, url: 'mailto:' + inquiryRecipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)};
}
if (typeof document !== 'undefined') {
  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('inquiry-status');
  const copy = document.getElementById('inquiry-copy');
  const fields = ['customer-name','customer-phone','customer-email','event-location','event-date','guest-count','event-type','event-message'];
  form.addEventListener('submit', event => event.preventDefault());
  const button = document.getElementById('prepare-inquiry');
  button.disabled = false;
  button.addEventListener('click', () => {
    for (const id of ['customer-name','customer-phone','event-location','event-message']) {
      const field = document.getElementById(id);
      field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
    }
    if (!form.reportValidity()) return;
    const inquiry = createInquiry(Object.fromEntries(fields.map(id => [id, document.getElementById(id).value])));
    copy.value = 'To: ' + inquiryRecipient + '\r\nSubject: ' + inquiry.subject + '\r\n\r\n' + inquiry.body;
    document.getElementById('email-fallback').hidden = false;
    status.textContent = 'Your inquiry is prepared, not sent. Review and send it in your email app. If it does not open, copy the text below into an email.';
    window.location.href = inquiry.url;
  });
  form.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    document.getElementById('email-fallback').hidden = true;
    status.textContent = '';
  });
  document.getElementById('copy-inquiry').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.value); status.textContent = 'Copied. Paste into your email app and send to ' + inquiryRecipient + '. Nothing has been sent yet.'; }
    catch { copy.focus(); copy.select(); status.textContent = 'Select and copy the inquiry text, then paste it into your email app.'; }
  });
}
