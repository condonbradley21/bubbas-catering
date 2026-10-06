export class PublicError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const fail = message => {throw new PublicError(message,502);};
export function providerConfig(env){return {stripe:!!env.STRIPE_SECRET_KEY,paypal:!!(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET),paypalMode:env.PAYPAL_ENV==='live'?'live':'sandbox'};}
async function stripe(env,path,body,key){
 if(!env.STRIPE_SECRET_KEY) throw new PublicError('Connect the business Stripe account before using card refunds.',409);
 const response=await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.STRIPE_SECRET_KEY,...(body?{'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':key}: {})},body:body?new URLSearchParams(body):undefined,signal:AbortSignal.timeout(15000)});
 const result=await response.json(); if(!response.ok) fail('Stripe could not complete this request. Check the transaction in your Stripe account before retrying.'); return result;
}
async function paypal(env,path,body,key){
 if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET) throw new PublicError('Connect the business PayPal account before using PayPal refunds.',409);
 const root=env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
 const auth=await fetch(root+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
 const token=await auth.json(); if(!auth.ok||!token.access_token) fail('PayPal account connection failed.');
 const response=await fetch(root+'/v2/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',...(key?{'PayPal-Request-Id':key}: {})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 const result=await response.json(); if(!response.ok) fail('PayPal could not complete this request. Check the transaction in your PayPal account before retrying.'); return result;
}
export async function verifyPayment(env,provider,providerId,orderId){
 if(provider==='stripe'){
  if(!/^pi_[A-Za-z0-9]+$/.test(providerId)) throw new PublicError('Enter a Stripe payment intent ID beginning with pi_.');
  const p=await stripe(env,'payment_intents/'+providerId+'?expand[]=latest_charge');
  if(p.metadata?.order_id!==orderId) throw new PublicError('This payment must have an order_id matching this order in Stripe.');
  if(p.status!=='succeeded'||p.currency!=='usd'||!Number.isSafeInteger(p.amount_received)||p.amount_received<=0) throw new PublicError('Only completed USD payments can be linked.');
  if(p.latest_charge?.amount_refunded>0||p.latest_charge?.disputed) throw new PublicError('This payment already has a refund or dispute. Review it in Stripe.');
  return {amount:p.amount_received,currency:'USD',mode:p.livemode?'live':'test'};
 }
 if(provider==='paypal'){
  if(!/^[A-Za-z0-9]{8,40}$/.test(providerId)) throw new PublicError('Enter a valid PayPal capture ID.');
  const p=await paypal(env,'payments/captures/'+providerId);
  if(p.custom_id!==orderId&&p.invoice_id!==orderId) throw new PublicError('The PayPal custom ID or invoice ID must match this order ID.');
  const amount=parseCents(p.amount?.value);
  if(p.status!=='COMPLETED'||p.amount?.currency_code!=='USD'||amount<=0) throw new PublicError('Only completed USD captures can be linked.');
  return {amount,currency:'USD',mode:env.PAYPAL_ENV==='live'?'live':'sandbox'};
 }
 throw new PublicError('Choose cards (Stripe) or PayPal.');
}
export function parseCents(value){ if(!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new PublicError('Invalid payment amount.'); const [whole,fraction='']=String(value).split('.'); const cents=Number(whole)*100+Number(fraction.padEnd(2,'0')); if(!Number.isSafeInteger(cents)) throw new PublicError('Invalid payment amount.');return cents; }
export async function refundPayment(env,payment){
 if(payment.provider==='stripe'){
  const p=await stripe(env,'refunds',{payment_intent:payment.provider_id,amount:String(payment.amount),reason:'requested_by_customer','metadata[order_id]':payment.order_id},payment.refund_key);
  return {id:p.id,status:p.status==='succeeded'?'succeeded':p.status==='failed'||p.status==='canceled'?'failed':'pending'};
 }
 const p=await paypal(env,'payments/captures/'+payment.provider_id+'/refund',{amount:{value:(payment.amount/100).toFixed(2),currency_code:payment.currency},note_to_payer:'Bubba’s BBQ Pit cancelled order '+payment.order_id},payment.refund_key);
 return {id:p.id,status:p.status==='COMPLETED'?'succeeded':p.status==='FAILED'||p.status==='CANCELLED'?'failed':'pending'};
}
export async function checkRefund(env,payment){
 const p=payment.provider==='stripe'?await stripe(env,'refunds/'+payment.refund_id):await paypal(env,'payments/refunds/'+payment.refund_id);
 return {id:p.id,status:['succeeded','COMPLETED'].includes(p.status)?'succeeded':['failed','canceled','FAILED','CANCELLED'].includes(p.status)?'failed':'pending'};
}
