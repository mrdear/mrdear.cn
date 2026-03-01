<!-- Global site tag (gtag.js) - Google Analytics -->

{% if config.google_statistic %}
  <script>
    (function (w, d, measurementId) {
      if (!measurementId) return;

      w.dataLayer = w.dataLayer || [];
      w.gtag = w.gtag || function () {
        w.dataLayer.push(arguments);
      };

      w.gtag('js', new Date());
      w.gtag('config', measurementId);

      function loadGtag() {
        if (w.__gtagScriptLoading) return;
        w.__gtagScriptLoading = true;

        var script = d.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        script.crossOrigin = 'anonymous';
        d.head.appendChild(script);
      }

      function scheduleLoad() {
        if ('requestIdleCallback' in w) {
          w.requestIdleCallback(loadGtag, { timeout: 2000 });
          return;
        }
        setTimeout(loadGtag, 1200);
      }

      if (d.readyState === 'complete' || d.readyState === 'interactive') {
        scheduleLoad();
      } else {
        d.addEventListener('DOMContentLoaded', scheduleLoad);
      }

      setTimeout(loadGtag, 5000);
    })(window, document, '{{ config.google_statistic }}');
  </script>
{% endif %}
