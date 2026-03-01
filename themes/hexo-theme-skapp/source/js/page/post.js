window.addEventListener('load', function() {
    var postContent = document.querySelector('article.page__post');

    if (!postContent) return;

    new Pack(postContent)
        .base('js-ease-out-leave-active')
        .base('js-ease-out-leave')
        .transfrom('js-ease-out-enter-active')
        .end(function() {
            var arr = ['js-ease-out-enter', 'js-ease-out-enter-active', 'js-ease-out-leave', 'js-ease-out-leave-active'];

            arr.forEach(function(item) {
                postContent.classList.remove(item);
            });
        })
        .toggle();

    (function() {
        var tocAnchorElm = document.querySelector('.js-post-toc');
        var tocTriggerElm = document.querySelector('.js-post-toc-trigger');
        var tocPanelElm = document.querySelector('.js-post-toc-panel');

        if (!tocAnchorElm || !tocTriggerElm || !tocPanelElm) return;

        if (!tocPanelElm.querySelector('li')) {
            tocAnchorElm.classList.add('is-empty');
            return;
        }

        function closeTocPanel() {
            tocAnchorElm.classList.remove('is-open');
            tocTriggerElm.setAttribute('aria-expanded', 'false');
            tocPanelElm.setAttribute('aria-hidden', 'true');
        }

        function openTocPanel() {
            tocAnchorElm.classList.add('is-open');
            tocTriggerElm.setAttribute('aria-expanded', 'true');
            tocPanelElm.setAttribute('aria-hidden', 'false');
        }

        tocTriggerElm.addEventListener('click', function(event) {
            event.stopPropagation();
            if (tocAnchorElm.classList.contains('is-open')) {
                closeTocPanel();
            } else {
                openTocPanel();
            }
        });

        tocPanelElm.addEventListener('click', function(event) {
            event.stopPropagation();
        });

        tocPanelElm.querySelectorAll('a[href^="#"]').forEach(function(link) {
            link.addEventListener('click', function() {
                closeTocPanel();
            });
        });

        document.addEventListener('click', function() {
            closeTocPanel();
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeTocPanel();
            }
        });
    })();
});
