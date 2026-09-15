import { events } from './events-data.mjs';

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
if (typeof document !== 'undefined') {
  const container = document.getElementById('upcoming-events');
  const upcoming = upcomingEvents(events);
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
}
