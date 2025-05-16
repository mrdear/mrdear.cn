<meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes"/>
<meta name="format-detection" content="telephone=yes">
<meta name="author" content="{{ get_setting('author') }}" />
<meta name="designer" content="minfive" />
<meta name="keywords" content="{{ get_setting('keywords') }}"/>
<meta name="description" content="{{ get_setting('description') }}" />

<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="robots" content="all" />

{% if theme.google_site_verification %}
  <meta name="google-site-verification" content="{{ theme.google_site_verification }}" />
{% endif %}

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="{{ page.title || config.title }}">
<meta property="og:description" content="{{ page.description || config.description }}">
<meta property="og:url" content="{{ url }}">
<meta property="og:site_name" content="{{ config.title }}">
<meta property="og:locale" content="{{ config.language }}">
{% if page.cover || get_setting('default_cover') %}
<meta property="og:image" content="{{ page.cover || get_setting('default_cover') }}">
{% endif %}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page.title || config.title }}">
<meta name="twitter:description" content="{{ page.description || config.description }}">
{% if page.cover || get_setting('default_cover') %}
<meta name="twitter:image" content="{{ page.cover || get_setting('default_cover') }}">
{% endif %}

<link rel="canonical" href="{{ url }}">
<link rel="manifest" href="/manifest.json" />
<link rel="icon" type="image/png" href="{{ get_setting('favicon_ico') }}" sizes="32x32">

<!-- Prefetch -->
{% include './prefetch.swig' %}

<!-- CSS -->
{{ css('scss/base/index') }}

<!-- RSS -->
{{ feed_tag('atom.xml') }}

<!-- 统计 -->
{% include './analytics.swig' %}
