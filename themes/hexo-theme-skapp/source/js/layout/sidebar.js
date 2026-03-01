window.addEventListener('load', function () {
    // 回到顶部
    (function () {
        var sidebarTocElm = document.getElementById('sidebar-toc');
        if (sidebarTocElm && !isMobile()) {
            var oldOffetTop = sidebarTocElm.offsetTop;

            function scrollEvent() {
                var scrollTop = sidebarTocElm.offsetTop - document.documentElement.scrollTop;

                if (scrollTop < 50 && !sidebarTocElm.classList.contains('sidebar-toc')) {
                    sidebarTocElm.classList.add('sidebar-toc');
                    var next = sidebarTocElm.nextSibling;
                    while (next) {
                        next.classList.add('sidebar-hidden');
                        next = next.nextSibling;
                    }
                } else if (scrollTop > (-oldOffetTop + 110) && sidebarTocElm.classList.contains('sidebar-toc')) {
                    sidebarTocElm.classList.remove('sidebar-toc');
                    var next = sidebarTocElm.nextSibling;
                    while (next) {
                        next.classList.remove('sidebar-hidden');
                        next = next.nextSibling;
                    }
                }
            }

            scrollEvent();
            document.addEventListener('scroll', scrollEvent);
        }
    })();

    // 侧边栏广告：无填充或加载失败时隐藏广告块
    (function () {
        var adBlocks = document.querySelectorAll('.js-sidebar-ads');
        if (!adBlocks || !adBlocks.length) return;

        function hideAdBlock(block) {
            block.classList.add('sidebar-ads-hidden');
        }

        function showAdBlock(block) {
            block.classList.remove('sidebar-ads-hidden');
        }

        function inspectStatus(block, unit) {
            var status = unit.getAttribute('data-ad-status');
            if (status === 'filled') {
                showAdBlock(block);
                return true;
            }

            if (status === 'unfilled') {
                hideAdBlock(block);
                return true;
            }

            return false;
        }

        Array.prototype.forEach.call(adBlocks, function (block) {
            var unit = block.querySelector('.js-sidebar-ads-unit');
            if (!unit) {
                hideAdBlock(block);
                return;
            }

            var timer = setTimeout(function () {
                var status = unit.getAttribute('data-ad-status');
                var hasIframe = !!unit.querySelector('iframe');
                if (status !== 'filled' && !hasIframe) {
                    hideAdBlock(block);
                }
            }, 12000);

            var observer = new MutationObserver(function () {
                if (inspectStatus(block, unit)) {
                    clearTimeout(timer);
                    observer.disconnect();
                }
            });

            observer.observe(unit, {
                attributes: true,
                attributeFilter: ['data-ad-status']
            });

            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                clearTimeout(timer);
                observer.disconnect();
                hideAdBlock(block);
                return;
            }

            if (inspectStatus(block, unit)) {
                clearTimeout(timer);
                observer.disconnect();
            }
        });
    })();
});
