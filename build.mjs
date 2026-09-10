import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await fs.readFile('index.html','utf8');
const files=['index.html','styles.css','scheduling.css','scheduling.mjs','scheduling-core.mjs','mn-zips.mjs','bubbas-original-logo.png','bubbas-bbq-pit.png','bubbas-chrome-logo.png'];
if(html.includes('bbq-hero.png'))files.push('bbq-hero.png');
for(const [,link] of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(link==='#')continue;if(link.startsWith('tel:')){assert.equal(link,'tel:+12182704227');continue;}if(['mailto:bubbasbbqpit@gmail.com','https://www.facebook.com/profile.php?id=100057699540159','https://www.geonames.org/'].includes(link))continue;if(link.startsWith('#'))assert.ok(html.includes(`id="${link.slice(1)}"`),'Broken anchor: '+link);else assert.ok(files.includes(link),'Unexpected reference: '+link);}
assert.ok(html.includes('Meat processing &amp; butchering')||html.includes('Meat processing & butchering'));
assert.ok(html.includes('This is a date request, not a live availability calendar.'));
await fs.mkdir('dist',{recursive:true});
for(const file of files){assert.ok((await fs.stat(file)).size>0);await fs.copyFile(file,'dist/'+file);}
console.log('Build passed: page, assets, navigation anchors, and honest booking state.');
