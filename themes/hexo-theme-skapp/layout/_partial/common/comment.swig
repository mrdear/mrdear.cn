{% if page.comments && config.gitTalk %}
    <!-- Added defer attribute to ensure non-blocking loading -->
    <script src="https://giscus.app/client.js"
            data-repo="mrdear/mrdear.cn"
            data-repo-id="R_kgDOIEi9fQ"
            data-category="General"
            data-category-id="DIC_kwDOIEi9fc4CRrm_"
            data-mapping="url"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="light"
            data-lang="zh-CN"
            data-loading="lazy"
            crossorigin="anonymous"
            async
            defer>
    </script>
{% endif %}

{% if page.comments && config.disqus_shortname %}
    <script>
        if (!isMobile()) {
            var disqus_shortname = '{{ config.disqus_shortname }}';
            var disqus_config = function () {
                this.page.url = '{{ config.url }}/{{ page.path }}';
                this.page.identifier = '/{{ page.path }}';
                this.page.title = '{{ page.title }}';
            };

            // Load Disqus after the page has loaded to prevent blocking
            window.addEventListener('load', function() {
                setTimeout(function() {
                    var d = document, s = d.createElement('script');
                    s.type = 'text/javascript'; 
                    s.async = true;
                    s.src = 'https://' + disqus_shortname + '.disqus.com/embed.js';
                    s.setAttribute('data-timestamp', +new Date());
                    var node = document.getElementsByTagName("script")[0];
                    node.parentNode.insertBefore(s, node);
                }, 500); // Small delay to ensure page is fully rendered
            });
        }
    </script>
    <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
{% endif %}
