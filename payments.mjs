// Frontend preview only. No requests, storage, recipients, or checkout URLs.
export const paymentMethods = {
  venmo: { name: 'Venmo', notice: 'Venmo is not connected yet. No payment will be sent.' },
  paypal: { name: 'PayPal', notice: 'PayPal is not connected yet. No payment will be sent.' },
  card: { name: 'Credit / debit card', notice: 'Card checkout is not connected yet. Card details will be entered with the payment provider, not on this page.' }
};
export function formatAmount(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Not entered';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999.99) return 'Not entered';
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(amount);
}
if (typeof document !== 'undefined') {
  const update = () => {
    const method = paymentMethods[document.querySelector('input[name="payment-method"]:checked').value];
    document.getElementById('summary-method').textContent = method.name;
    document.getElementById('method-help').textContent = method.notice;
    document.getElementById('checkout-button').textContent = method.name + ' coming soon';
    document.getElementById('summary-type').textContent = document.getElementById('payment-type').value;
    document.getElementById('summary-amount').textContent = formatAmount(document.getElementById('payment-amount').value);
  };
  document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener('change', update));
  document.getElementById('payment-type').addEventListener('change', update);
  document.getElementById('payment-amount').addEventListener('input', update);
  update();
}
