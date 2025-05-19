window.addEventListener('load', function() {

    var posts = document.querySelectorAll('article.page__mini-article');

    posts.forEach(function(post) {
        if (post.parentElement.parentElement.classList.contains('js-hidden')) return;

        var pack = new Pack(post);

        pack
            .base('js-ease-out-leave-active')
            .base('js-ease-out-leave')
            .transfrom('js-ease-out-enter-active')
            .end(function () {
                var arr = ['js-ease-out-enter', 'js-ease-out-enter-active', 'js-ease-out-leave', 'js-ease-out-leave-active'];

                arr.forEach(function (item) {
                    post.classList.remove(item);
                });
            })
            .toggle();
    });

});
