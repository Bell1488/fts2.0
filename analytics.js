(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  m[i].l = 1 * new Date();
  for (var j = 0; j < document.scripts.length; j += 1) {
    if (document.scripts[j].src === r) return;
  }
  k = e.createElement(t);
  a = e.getElementsByTagName(t)[0];
  k.async = 1;
  k.src = r;
  a.parentNode.insertBefore(k, a);
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=113573294', 'ym');

ym(113573294, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true
});

window.trackMetrikaGoal = function (goal, params) {
  if (typeof window.ym === 'function') window.ym(113573294, 'reachGoal', goal, params);
};

document.addEventListener('click', function (event) {
  var link = event.target.closest('a[href*="t.me/FTSPay_Support"]');
  if (link) window.trackMetrikaGoal('messenger_click', { href: link.href });
});
