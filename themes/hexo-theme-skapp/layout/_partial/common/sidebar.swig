<aside class="page__sidebar">
    {% set adsense = get_setting('adsense') %}
    {% set adsense_sidebar = adsense && adsense.sidebar %}

    <!-- {% if get_setting('qrcode', 'avatar') %}
        <div class="sidebar__img">
            <img src="{{ get_setting('qrcode', 'avatar') }}" alt="{{ get_setting('title') }}" title="{{ get_setting('title') }}">
        </div>
    {% endif %} -->

    <form id="page-search-from" class="page__search-from" action="/search/">
        <label class="search-form__item">
            <input class="input" type="text" name="search" placeholder="Search...">
            <i class="iconfont icon-search"></i>
        </label>
    </form>

    {% if get_setting('description') %}
        <div class="sidebar__block">
            <h3 class="block__title">{{ __('aside.introduction') }}</h3>
            <p class="block__text">{{ get_setting('description') }}</p>
        </div>
    {% endif %}

    <div class="sidebar__block">
        <h3 class="block__title">{{ __('aside.categorie') }}</h3>
        {{ list_categories({ order: -1, class: 'block' }) }}
    </div>

    {% if adsense && adsense.enable && adsense.client && adsense_sidebar && adsense_sidebar.enable && adsense_sidebar.slot %}
        <div class="sidebar__block sidebar__block--ads js-sidebar-ads">
            {% if adsense_sidebar.title %}
                <h3 class="block__title">{{ adsense_sidebar.title }}</h3>
            {% endif %}
            <div class="ads-container">
                <ins class="adsbygoogle js-sidebar-ads-unit"
                     style="{{ adsense_sidebar.style || 'display:block' }}"
                     data-ad-client="{{ adsense.client }}"
                     data-ad-slot="{{ adsense_sidebar.slot }}"
                     {% if adsense_sidebar.format %}
                     data-ad-format="{{ adsense_sidebar.format }}"
                     {% endif %}
                     data-full-width-responsive="{{ adsense_sidebar.full_width_responsive ? 'true' : 'false' }}"></ins>
            </div>
        </div>
    {% endif %}

    <div class="sidebar__block">
        <h3 class="block__title">{{ __('aside.tag') }}</h3>
        {{ tags({ order: -1 }) }}
    </div>

</aside>
