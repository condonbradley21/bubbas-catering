import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const pages = ['index.html', 'payments.html', 'inquiry.html','staff.html','assistant.html'];
const files = [...pages, 'styles.css', 'menu.css', 'scheduling.css', 'payments.css', 'inquiry.css', 'inquiry.mjs',
  'scheduling.mjs', 'scheduling-core.mjs', 'mn-zips.mjs', 'events.mjs',
  'events-data.mjs', 'payments.mjs', 'bubbas-original-logo.png',
  'bubbas-bbq-pit.png', 'bubbas-chrome-logo.png', 'bbq-hero.png','staff.css','staff.mjs','assistant.css','assistant.mjs','assistant-config.mjs','demo-menu.mjs'];
const documents = Object.fromEntries(await Promise.all(pages.map(async page => [page, await fs.readFile(page, 'utf8')])));
const external = new Set(['mailto:bubbasbbqpit@gmail.com', 'mailto:condonbradley21@gmail.com',
  'https://www.facebook.com/profile.php?id=100057699540159', 'https://www.geonames.org/']);
for (const [page, html] of Object.entries(documents)) {
  for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (link === '#' || external.has(link)) continue;
    if (link.startsWith('tel:')) { assert.equal(link, 'tel:+12182704227'); continue; }
    const [path, anchor] = link.split('#');
    const target = path || page;
    assert.ok(files.includes(target), 'Unexpected reference: ' + link);
    if (anchor) assert.ok(documents[target]?.includes('id="' + anchor + '"'), 'Broken anchor: ' + link);
  }
}
assert.ok(documents['index.html'].includes('This is a date request, not a live availability calendar.'));
assert.ok(!documents['index.html'].includes('id="payment-preview"'));
assert.match(documents['inquiry.html'], /action="https:\/\/formsubmit.co\/bubbasbbqpit@gmail.com" method="POST"/);
for (const name of ['name', 'phone', 'email', 'location', 'preferred_date', 'guest_count', 'event_type', 'message']) assert.ok(documents['inquiry.html'].includes('name="' + name + '"'));
assert.ok(!documents['inquiry.html'].includes('Prepare inquiry email'));
assert.ok(!documents['inquiry.html'].includes('name="_captcha" value="false"'));
assert.match(documents['payments.html'], /id="checkout-button"[^>]*disabled/);
for (const method of ['venmo', 'paypal', 'card']) assert.ok(documents['payments.html'].includes('value="' + method + '"'));
await fs.mkdir('dist', {recursive: true});
await fs.mkdir('dist/server', {recursive:true});
await fs.mkdir('dist/.openai',{recursive:true});
const assets={};
for (const file of files) {
  assert.ok((await fs.stat(file)).size > 0);
  // Remove former static output so protected routes always reach the Worker.
  await fs.rm('dist/'+file,{force:true});
  const binary=file.endsWith('.png');
  const data=await fs.readFile(file);
  assets['/'+file]={binary,data:binary?data.toString('base64'):data.toString('utf8'),type:binary?'image/png':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'};
}
// A dependency-free Worker preserves the existing site and serves guarded staff routes.
await fs.writeFile('dist/server/assets.mjs','export const assets='+JSON.stringify(assets)+';\n');
await fs.copyFile('worker.mjs','dist/server/index.js');
await fs.copyFile('payment-providers.mjs','dist/server/payment-providers.mjs');
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Build passed: website references, order portal, protected Worker and migration package.');
