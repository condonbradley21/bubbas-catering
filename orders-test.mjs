import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker,{staffIdentity,validateOrder} from './dist/server/index.js';
import {verifyPayment,parseCents} from './payment-providers.mjs';
class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(fs.readFileSync('drizzle/0000_previous_galactus.sql','utf8'));}
 prepare(sql){const db=this.db;const make=args=>({bind(...values){return make(values);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});return make([]);}
 async batch(statements){this.db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());this.db.exec('COMMIT');return results;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
const origin='https://bubbas.test';
const data=()=>({name:'Test Customer',email:'customer@example.com',phone:'2185550123',location:'Nimrod',preferred_date:'2026-11-20',guest_count:'20',event_type:'Wedding',message:'Menu request',request_key:crypto.randomUUID()});
const request=(path,body,staff=true)=>new Request(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Origin':origin,'Content-Type':'application/json'}:{}),...(staff?{'oai-authenticated-user-id':'test-user','oai-authenticated-user-email':'condonbradley21@gmail.com'}:{})},body:body?JSON.stringify(body):undefined});
test('staff routes require identity and explicit allowlist',async()=>{
 assert.equal(staffIdentity(request('/'),{}),'condonbradley21@gmail.com');
 assert.equal(staffIdentity(new Request(origin,{headers:{'oai-authenticated-user-email':'condonbradley21@gmail.com'}}),{}),null);
 assert.equal(staffIdentity(request('/'),{STAFF_EMAILS:'someone@example.com'}),null);
 assert.equal((await worker.fetch(request('/api/staff/orders',null,false),{})).status,403);
 assert.equal((await worker.fetch(request('/staff.html',null,false),{})).status,302);
 const denied=new Request(origin+'/staff.html',{headers:{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.com'}});
 assert.equal((await worker.fetch(denied,{})).status,403);
});
test('requests persist, retries reuse IDs, changed payload is rejected, and details stay private',async()=>{
 const env={DB:new D1()};const body=data();const first=await worker.fetch(request('/api/orders',body,false),env);assert.equal(first.status,201);const {id}=await first.json();
 const second=await worker.fetch(request('/api/orders',body,false),env);assert.equal((await second.json()).id,id);
 assert.equal((await worker.fetch(request('/api/orders',{...body,message:'Different'},false),env)).status,409);
 const list=await worker.fetch(request('/api/staff/orders'),env);assert.equal((await list.json()).orders.length,1);
 assert.equal((await worker.fetch(request('/api/staff/orders/'+id,null,false),env)).status,403);
 const detail=await worker.fetch(request('/api/staff/orders/'+id),env);assert.equal((await detail.json()).order.name,body.name);
 const badOrigin=new Request('https://bubbas.test/api/orders',{method:'POST',headers:{Origin:'https://evil.test'},body:JSON.stringify(data())});assert.equal((await worker.fetch(badOrigin,env)).status,403);
});
test('validation rejects malformed inputs without losing server availability',()=>{
 assert.throws(()=>validateOrder({...data(),preferred_date:'2026-99-99'}),/date/);
 assert.throws(()=>validateOrder({...data(),guest_count:'-1'}),/guest/);
 assert.throws(()=>validateOrder({...data(),website:'spam'}),/submit/);
 assert.equal(parseCents('10.05'),1005);assert.throws(()=>parseCents('1e5'));
});
test('cancellation is separate from refunds and cannot be reopened',async()=>{
 const env={DB:new D1()};const {id}=await (await worker.fetch(request('/api/orders',data()),env)).json();
 assert.equal((await worker.fetch(request('/api/staff/orders/'+id+'/status',{status:'cancelled'}),env)).status,400);
 assert.equal((await worker.fetch(request('/api/staff/orders/'+id+'/status',{status:'cancelled',reason:'Customer cancelled'}),env)).status,200);
 assert.equal((await worker.fetch(request('/api/staff/orders/'+id+'/status',{status:'confirmed'}),env)).status,409);
});
test('Stripe and PayPal reject unrelated payments and verify matching order references',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async url=>new Response(JSON.stringify(String(url).includes('oauth2')?{access_token:'mock-token'}:String(url).includes('paypal')?{custom_id:'wrong',status:'COMPLETED',amount:{value:'10.00',currency_code:'USD'}}:{metadata:{order_id:'wrong'},status:'succeeded',currency:'usd',amount_received:1000,latest_charge:{},livemode:false}));
 try{await assert.rejects(()=>verifyPayment({STRIPE_SECRET_KEY:'mock'},'stripe','pi_test','BBQ-example'),/matching/);await assert.rejects(()=>verifyPayment({PAYPAL_CLIENT_ID:'mock',PAYPAL_CLIENT_SECRET:'mock'},'paypal','CAPTURE1234','BBQ-example'),/match/);}finally{globalThis.fetch=original;}
});
test('full refund uses original transaction and a durable one-time claim',async()=>{
 const env={DB:new D1(),STRIPE_SECRET_KEY:'mock'};const {id}=await (await worker.fetch(request('/api/orders',data()),env)).json();
 await env.DB.prepare("INSERT INTO payments (id,order_id,provider,provider_id,amount,currency,mode,refund_status,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind('payment1',id,'stripe','pi_mock',1000,'USD','test','none',new Date().toISOString()).run();
 const action=()=>request('/api/staff/orders/'+id+'/refund',{payment_id:'payment1',confirm_order_id:id});assert.equal((await worker.fetch(action(),env)).status,409);
 await worker.fetch(request('/api/staff/orders/'+id+'/status',{status:'cancelled',reason:'Customer cancelled'}),env);
 const original=globalThis.fetch;let refunds=0;
 globalThis.fetch=async (url,options)=>{if(String(url).includes('/refunds')){refunds++;assert.ok(options.headers['Idempotency-Key']);assert.equal(options.body.get('amount'),'1000');return new Response(JSON.stringify({id:'re_mock',status:'succeeded'}));}return new Response(JSON.stringify({metadata:{order_id:id},status:'succeeded',currency:'usd',amount_received:1000,latest_charge:{},livemode:false}));};
 try{const results=await Promise.all([worker.fetch(action(),env),worker.fetch(action(),env)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(refunds,1);assert.equal((await env.DB.prepare('SELECT refund_status FROM payments WHERE id=?').bind('payment1').first()).refund_status,'succeeded');}finally{globalThis.fetch=original;}
});
test('ambiguous provider response blocks further refunds',async()=>{
 const env={DB:new D1(),STRIPE_SECRET_KEY:'mock'};const {id}=await (await worker.fetch(request('/api/orders',data()),env)).json();await worker.fetch(request('/api/staff/orders/'+id+'/status',{status:'cancelled',reason:'Cancelled'}),env);
 await env.DB.prepare("INSERT INTO payments (id,order_id,provider,provider_id,amount,currency,mode,refund_status,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind('payment2',id,'stripe','pi_mock',500,'USD','test','none',new Date().toISOString()).run();
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async url=>{if(String(url).includes('/refunds')){calls++;throw new Error('Timeout');}return new Response(JSON.stringify({metadata:{order_id:id},status:'succeeded',currency:'usd',amount_received:500,latest_charge:{},livemode:false}));};
 const action=()=>request('/api/staff/orders/'+id+'/refund',{payment_id:'payment2',confirm_order_id:id});try{assert.equal((await worker.fetch(action(),env)).status,502);assert.equal((await worker.fetch(action(),env)).status,409);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
