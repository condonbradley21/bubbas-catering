// Illustrative prices, never approved quotes. Integer cents keep totals exact.
export const demoMenu=[
 {id:'brisket-sandwich',name:'Brisket sandwich',unit:'sandwich',price_cents:1400,aliases:['brisket sandwich','brisket sandwiches']},
 {id:'pulled-pork-sandwich',name:'Pulled pork sandwich',unit:'sandwich',price_cents:1000,aliases:['pulled pork sandwich','pulled pork sandwiches','pork sandwiches']},
 {id:'chicken-sandwich',name:'Sweet Cajun chicken sandwich',unit:'sandwich',price_cents:1100,aliases:['chicken sandwich','chicken sandwiches']},
 {id:'half-rack-ribs',name:'Half rack of ribs',unit:'half rack',price_cents:1800,aliases:['half rack of ribs','half racks of ribs','half racks','half rack']},
 {id:'full-rack-ribs',name:'Full rack of ribs',unit:'full rack',price_cents:3000,aliases:['full rack of ribs','full racks of ribs','full racks','full rack']},
 {id:'mac-cheese',name:'Mac & cheese',unit:'individual side',price_cents:450,aliases:['mac and cheese','mac & cheese','mac cheese']},
 {id:'coleslaw',name:'Coleslaw',unit:'individual side',price_cents:350,aliases:['coleslaw','slaw']},
 {id:'bbq-beans',name:'BBQ beans',unit:'individual side',price_cents:400,aliases:['bbq beans','baked beans','beans']},
];
export const demoNotice='DEMO PRICING — illustrative only. Not an approved quote or booking. Tax, delivery, staffing, and other fees are not included.';
export function calculateEstimate(items,menu=demoMenu){
 if(!Array.isArray(items)||items.length>30)throw new Error('Choose up to 30 menu items.');
 const quantities=new Map();
 for(const item of items){if(!menu.some(m=>m.id===item.id))throw new Error('Choose an item from the demo menu.');if(!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>500)throw new Error('Use a whole quantity from 1 to 500.');quantities.set(item.id,(quantities.get(item.id)||0)+item.quantity);if(quantities.get(item.id)>500)throw new Error('Maximum 500 of each item.');}
 const lines=Array.from(quantities,([id,quantity])=>{const m=menu.find(m=>m.id===id);return {id,name:m.name,unit:m.unit,quantity,price_cents:m.price_cents,total_cents:quantity*m.price_cents};});
 return {lines,subtotal_cents:lines.reduce((s,l)=>s+l.total_cents,0),excluded:['Tax','Delivery','Staffing / service charges'],demo:true};
}
export function interpretDemo(message,menu=demoMenu){
 const text=String(message).toLowerCase().replace(/-/g,' ');const items=[];
 for(const item of menu){const aliases=[...item.aliases].sort((a,b)=>b.length-a.length);for(const alias of aliases){const safe=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=text.match(new RegExp('(?:^|\\b)(\\d+)\\s+(?:orders? of\\s+)?'+safe+'\\b'));if(match){items.push({id:item.id,quantity:Number(match[1])});break;}}}
 if(items.length)return {intent:'estimate',items,reply:'Here is the sample food subtotal for the items I recognized. Review the quantities below; other items in your message may need to be added with the menu picker.'};
 if(/event|food truck|upcoming|where.*(?:you|truck)|schedule/.test(text))return {intent:'events',items:[],reply:'No confirmed upcoming public events are posted yet. Call 218-270-4227 or check Bubba’s Facebook page. Public events do not confirm private booking availability.'};
 if(/price|cost|menu/.test(text))return {intent:'menu',items:[],reply:'Use the sample menu to build an estimate. Every price here is illustrative, and each side is an individual portion.'};
 return {intent:'help',items:[],reply:'Try “20 brisket sandwiches and 20 coleslaw,” ask about upcoming events, or use the menu picker. This guided demo uses menu keywords; natural conversation will be enabled after the service connection is complete.'};
}
