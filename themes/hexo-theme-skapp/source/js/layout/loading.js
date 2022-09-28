// loading
document.onreadystatechange = function(){
    console.log(document.readyState)
    var timeout;
    if (document.readyState === 'interactive') {
        timeout = window.setTimeout(function(){
            disableLoad();
        },1000);
    }

    if (document.readyState === 'complete') {
        clearTimeout(timeout)
        var page2 = document.getElementById('page');
        if (page2.classList.contains('js-hidden')) {
            disableLoad();
        }
    }
};

function disableLoad(){
    var
    page = document.getElementById('page'),
    loading = document.getElementById('page-loading');

    loading.classList.add('js-hidden');
    page.classList.remove('js-hidden');
}
