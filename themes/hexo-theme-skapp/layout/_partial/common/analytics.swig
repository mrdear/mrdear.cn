<!-- Global site tag (gtag.js) - Google Analytics -->

{% if config.google_statistic %}
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PXMBKW99SD"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-PXMBKW99SD');
  </script>
{% endif %}