import {calculateEstimate,interpretDemo} from '../../../demo-menu.mjs';
// Database-backed guided demo. AI requests are added after the approved key connection.
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'https://condonbradley21.github.io').split(',').map(s=>s.trim());
async function db(path:string,method='GET',body?:unknown){
 const root=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!root||!key)throw new Error('Database connection unavailable.');
 const response=await fetch(root+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Database request failed.');return response.json();
}
async function hash(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('');}
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('Origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(!allowed.includes(origin))return new Response('Origin not allowed',{status:403});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 try{
  const raw=await request.text();if(raw.length>6000)return reply({error:'Request too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
  if(!['catalog','chat','order'].includes(body.action))return reply({error:'Choose a supported action.'},400);
  const hour=new Date().toISOString().slice(0,13),ip=request.headers.get('x-forwarded-for')||'unknown';
  const bucket=await hash(ip+'|'+hour);
  if(!await db('rpc/consume_demo_limit','POST',{p_bucket:bucket,p_limit:60}))return reply({error:'Demo request limit reached. Try again later.'},429);
  if(!await db('rpc/consume_demo_limit','POST',{p_bucket:'global|'+hour,p_limit:500}))return reply({error:'The demo is busy. Try again later.'},429);
  const menu=await db('demo_menu?active=eq.true&select=id,name,unit,price_cents,aliases&order=id');
  if(body.action==='catalog')return reply({menu,mode:'guided',demo:true});
  if(body.action==='chat'){
   if(typeof body.message!=='string'||body.message.length>1000)return reply({error:'Keep your message under 1,000 characters.'},400);
   const result=interpretDemo(body.message,menu);
   if(result.intent==='events'){
    const events=await db('demo_events?confirmed=eq.true&ends_at=gte.'+encodeURIComponent(new Date().toISOString())+'&select=title,starts_at,ends_at,venue,address&order=starts_at&limit=20');
    if(events.length)result.reply=events.map((e:any)=>e.title+' — '+new Date(e.starts_at).toLocaleString('en-US',{timeZone:'America/Chicago'})+' (Minnesota time), '+e.venue+', '+e.address).join('\n');
   }
   return reply({...result,estimate:calculateEstimate(result.items,menu),mode:'guided',demo:true});
  }
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100||typeof body.notes!=='string'||body.notes.length>500||typeof body.date!=='string'||!Array.isArray(body.items)||!body.items.length||! /^[a-f0-9-]{36}$/.test(body.request_key||''))return reply({error:'Please check your practice request details.'},400);
  if(body.date){const date=new Date(body.date);if(!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==body.date)return reply({error:'Choose a valid date.'},400);}
  let estimate;try{estimate=calculateEstimate(body.items,menu);}catch(error){return reply({error:(error as Error).message},400);}
  const payloadHash=await hash(JSON.stringify({name:body.name.trim(),date:body.date,notes:body.notes.trim(),items:estimate.lines.map((l:any)=>({id:l.id,quantity:l.quantity}))}));
  const existing=await db('demo_order_requests?request_key=eq.'+encodeURIComponent(body.request_key)+'&select=id,estimate,payload_hash');
  if(existing.length){if(existing[0].payload_hash!==payloadHash)return reply({error:'This request was already used. Start a new practice request.'},409);return reply({id:'DEMO-'+existing[0].id,estimate:existing[0].estimate,demo:true});}
  // Unique request_key makes insert races safe; retries read the original record.
  let saved;
  try{saved=await db('demo_order_requests','POST',{request_key:body.request_key,payload_hash:payloadHash,customer_name:body.name.trim(),preferred_date:body.date||null,notes:body.notes.trim(),estimate});}
  catch(error){const repeated=await db('demo_order_requests?request_key=eq.'+encodeURIComponent(body.request_key)+'&select=id,estimate,payload_hash');if(!repeated.length||repeated[0].payload_hash!==payloadHash)throw error;saved=repeated;}
  return reply({id:'DEMO-'+saved[0].id,estimate:saved[0].estimate,demo:true},201);
 }catch(error){console.error('Demo assistant request failed');return reply({error:'The demo service is temporarily unavailable. Your estimate is still on this page.'},503);}
});
