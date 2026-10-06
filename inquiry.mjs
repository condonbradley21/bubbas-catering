// Save the request before the native FormSubmit POST. Keep its spam check enabled.
// The dashboard is durable; inbox delivery requires recipient activation.
const form = document.getElementById('inquiry-form');
const button = document.getElementById('send-inquiry');
const status = document.getElementById('inquiry-status');
const params=new URLSearchParams(location.search);
if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('date')||''))document.getElementById('event-date').value=params.get('date');
if(params.get('location'))document.getElementById('event-location').value=params.get('location').slice(0,250);
const service=params.get('service');
if(service){const options=Array.from(document.getElementById('event-type').options);const match=options.find(o=>o.value.toLowerCase().includes(service.toLowerCase()));if(match)document.getElementById('event-type').value=match.value;else document.getElementById('event-message').value='Service requested: '+service.slice(0,100)+'\n';}
let requestKey=crypto.randomUUID();
form.addEventListener('submit', async event => {
  event.preventDefault();
  for (const id of ['customer-name', 'customer-phone', 'event-location', 'event-message']) {
    const field = document.getElementById(id);
    field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
  }
  if (!form.reportValidity()) { event.preventDefault(); return; }
  button.disabled = true;
  button.textContent = 'Saving your request…';
  status.textContent = 'Saving your event request before sending it to Bubba’s.';
  try {
    const data=Object.fromEntries(new FormData(form));
    const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,request_key:requestKey})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Your request could not be saved.');
    document.getElementById('order-id').value=result.id;
    document.getElementById('email-subject').value='Bubba’s order request '+result.id;
    status.textContent='Request saved: '+result.id+'. Complete the spam check on the next page to send the business email. This does not confirm a booking.';
    document.getElementById('saved-order').textContent='Your order request ID: '+result.id;
    document.getElementById('saved-order').hidden=false;
    button.textContent='Continue to email delivery';
    // Native POST retains FormSubmit’s CAPTCHA and includes the saved order ID.
    HTMLFormElement.prototype.submit.call(form);
  } catch(error) {
    status.textContent=error.message+' Your form details are still here. Retry or call Bubba’s.';
    button.disabled=false;button.textContent='Save & send request';
  }
});
form.addEventListener('input', event => {
  if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
});
window.addEventListener('pageshow', () => {
  button.disabled = false;
  button.textContent = 'Save & send request';
  status.textContent = '';
});
