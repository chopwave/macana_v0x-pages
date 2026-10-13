// Anonymous page analytics: sends the page, the referring site, UTM tags and whether a member is
// logged in. No cookie, storage identifier, IP address or user agent string is kept.
(function () {
  'use strict';
  try {
    const config = window.JPX_DASHBOARD_PUBLIC_CONFIG?.auth || {};
    if (!/^https:\/\//.test(config.url || '') || location.protocol !== 'https:') return;
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
    const params = new URLSearchParams(location.search);
    const event = {path: location.pathname};
    try {
      const referrer = new URL(document.referrer);
      if (referrer.hostname !== location.hostname) event.referrer_host = referrer.hostname;
    } catch (_) {}
    try { event.member = !!sessionStorage.getItem('macanaMemberSessionV1'); } catch (_) {}
    const tags = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    for (const key of tags) {
      const value = params.get(key);
      if (value) event[key] = value.slice(0, 100);
    }
    const url = config.url.replace(/\/$/, '') + '/functions/v1/page-event';
    const body = JSON.stringify(event);
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
      fetch(url, {method: 'POST', body, keepalive: true, mode: 'no-cors'}).catch(() => {});
    }
    // Drop the tags from the address bar so a shared link is not counted as coming from note.
    if (tags.some(key => params.has(key))) {
      for (const key of tags) params.delete(key);
      const clean = location.pathname + (params.toString() ? '?' + params : '') + location.hash;
      history.replaceState(history.state, '', clean);
    }
  } catch (_) {}
})();
