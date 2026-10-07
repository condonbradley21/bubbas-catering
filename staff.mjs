if(location.hostname.endsWith('.github.io')||location.hostname==='127.0.0.1'||location.hostname==='localhost')await import('./staff-supabase.mjs');else await import('./staff-legacy.mjs');
