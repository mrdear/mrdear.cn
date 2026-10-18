window.addEventListener('load', function () {
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

            var retryCount = 0;
            var maxRetryCount = 20;

            function tryPushAds() {
                try {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    return true;
                } catch (e) {
                    retryCount += 1;
                    if (retryCount >= maxRetryCount) {
                        clearTimeout(timer);
                        observer.disconnect();
                        hideAdBlock(block);
                        return false;
                    }

                    setTimeout(tryPushAds, 500);
                    return false;
                }
            }

            if (!tryPushAds()) {
                return;
            }

            if (inspectStatus(block, unit)) {
                clearTimeout(timer);
                observer.disconnect();
            }
        });
    })();
});
