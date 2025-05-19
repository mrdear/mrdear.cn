// loading
document.onreadystatechange = function(){
    // Use 'complete' to ensure all resources are loaded before showing the page
    if (document.readyState === 'complete') {
        var page = document.getElementById('page');
        if (page.classList.contains('js-hidden')) {
            disableLoad();
        }
    }
};

function disableLoad(){
    var
    page = document.getElementById('page'),
    loading = document.getElementById('page-loading');

    // Add transition classes for smooth animation
    loading.classList.add('js-ease-out-leave');
    page.classList.add('js-ease-out-leave', 'js-ease-out-leave-active');

    // Show the page first with animation
    page.classList.remove('js-hidden');
    setTimeout(function() {
        page.classList.add('js-ease-out-enter-active');

        // Hide the loading element after the page animation starts
        setTimeout(function() {
            loading.classList.add('js-hidden');
        }, 100);
    }, 10);
}
