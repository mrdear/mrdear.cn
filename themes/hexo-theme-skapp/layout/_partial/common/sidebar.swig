<aside class="page__sidebar">
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

    {% if page.content && page.path != 'about/index.html' %}
        <div class="sidebar__block" id="sidebar-toc">
            <h3 class="block__title">{{ __('aside.article_categiry') }}</h3>
            <div class="post-toc">
                {{ toc(page.content) }}
            </div>
        </div>
    {% endif %}

    <div class="sidebar__block">
        <h3 class="block__title">{{ __('aside.tag') }}</h3>
        {{ tags({ order: -1 }) }}
    </div>

</aside>