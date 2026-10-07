import {assistantConfig} from './assistant-config.mjs';

export function upcomingEvents(records, now = Date.now()) {
  return records.filter(event => {
    const start = Date.parse(event.start), end = Date.parse(event.end);
    return event.title && event.venue && event.address &&
      Number.isFinite(start) && Number.isFinite(end) && end >= start && end >= now;
  }).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric'
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit'
});
async function loadPublicEvents(){
  const container = document.getElementById('upcoming-events');
  if(!container)return;
  try{
  const response=await fetch(assistantConfig.endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:assistantConfig.publicKey,Authorization:'Bearer '+assistantConfig.publicKey},body:JSON.stringify({action:'events'})});
  if(!response.ok)throw new Error('Unavailable');
  const data=await response.json();
  const upcoming = upcomingEvents(data.events.map(e=>({...e,start:e.starts_at,end:e.ends_at})));
  if (container && upcoming.length) {
    container.replaceChildren();
    for (const event of upcoming) {
      const card = document.createElement('article');
      card.className = 'upcoming-event';
      const add = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        card.append(element);
        return element;
      };
      const start = new Date(event.start), end = new Date(event.end);
      add('time', dateFormat.format(start)).dateTime = event.start;
      add('h3', event.title);
      add('p', dateFormat.format(start) === dateFormat.format(end)
        ? timeFormat.format(start) + ' – ' + timeFormat.format(end) + ' (Minnesota time)'
        : timeFormat.format(start) + ' through ' + dateFormat.format(end) + ', ' + timeFormat.format(end) + ' (Minnesota time)');
      add('strong', event.venue);
      add('p', event.address);
      if (event.details) add('p', event.details);
      const directions = add('a', 'Get directions ↗');
      directions.className = 'text-link';
      directions.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.venue + ', ' + event.address);
      directions.target = '_blank';
      directions.rel = 'noopener noreferrer';
      container.append(card);
    }
  }
  }catch{container.textContent='Upcoming events could not be loaded. Please check Bubba’s Facebook page or call 218-270-4227 before making a trip.';}
}
if(typeof document!=='undefined')loadPublicEvents();
