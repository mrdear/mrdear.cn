// loading
var loadAnimationDone = false;

function unlockPageIfNeeded() {
    var page = document.getElementById('page');
    if (!page || !page.classList.contains('js-hidden')) {
        return;
    }
    disableLoad();
}

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    unlockPageIfNeeded();
} else {
    document.addEventListener('DOMContentLoaded', unlockPageIfNeeded);
}

// Fallback: never keep the page blocked forever because of slow third-party resources.
window.addEventListener('load', unlockPageIfNeeded);
setTimeout(unlockPageIfNeeded, 3000);

function disableLoad(){
    if (loadAnimationDone) {
        return;
    }

    var
    page = document.getElementById('page'),
    loading = document.getElementById('page-loading');

    if (!page || !loading) {
        return;
    }

    loadAnimationDone = true;

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
