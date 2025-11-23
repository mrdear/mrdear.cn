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

    <div class="sidebar__block ads-container">
          <ins class="adsbygoogle"
               style="display:block; width: 100%; text-align: center; min-height: 280px;"
               data-ad-client="ca-pub-9024176106571603"
               data-ad-slot="2898525450"
               data-full-width-responsive="true"></ins>
          <script>
              // 延迟 500ms 再请求广告，确保 CSS 已经渲染完毕
              setTimeout(function() {
                  (adsbygoogle = window.adsbygoogle || []).push({});
              }, 500);
          </script>
      </div>

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


   <div class="sidebar__block ads-container">
       <ins class="adsbygoogle"
            style="display:block; width: 100%; text-align: center; min-height: 280px;"
            data-ad-client="ca-pub-9024176106571603"
            data-ad-slot="4020035436"
            data-full-width-responsive="true"></ins>
       <script>
           setTimeout(function() {
               (adsbygoogle = window.adsbygoogle || []).push({});
           }, 800);
       </script>
   </div>

</aside>