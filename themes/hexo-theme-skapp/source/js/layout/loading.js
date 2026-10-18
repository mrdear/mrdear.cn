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

    loading.classList.add('js-hidden');
    page.classList.remove('js-hidden');
}
