'use strict';

const assign = require('object-assign');
const pathFn = require('path');
const moment = require('moment')

const config = hexo.config.lunr = assign({
    field: 'all',
    path: 'assets/lunr/'
}, hexo.config.lunr);

hexo.extend.generator.register('lunr', function(locals){
    let config = this.config,
        lunrConfig = config.lunr,
        field = (lunrConfig.field||'').trim(),
        lunrPath = lunrConfig.path,
        posts = [], 
        pages = [],
        items;

    switch(field){
        case '':
        case 'post':
            posts = locals.posts.sort('-date');
            break;
        case 'page':
            pages = locals.pages;
            break;
        case 'all':
            posts = locals.posts.sort('-date');
            pages = locals.pages;
            break;
    }//switch
    items = posts.data.concat(pages.data);

    let store = {},
        tags,
        tagArr,
        cates;

    items.forEach(function(post){
        tags = [];
        cates = [];
        tagArr = [];
        if (post.tags) {
            post.tags.each(function(tag){
                tags.push(tag.name);
                tagArr.push({
                    name: tag.name,
                    path: config.root + tag.path
                });
            });
        }
        if (post.categories) {
            post.categories.each(function(cate){
                cates.push(cate.name);
            });
        }

        store['/' + post.path] = {
            url: '/' + post.path,
            title: post.title,
            tags: tags,
            tagArr: tagArr,
            cates: cates,
            cover: post.cover || hexo.config.default_cover || hexo.theme.config.default_cover,
            desc: post.subtitle || post.excerpt || "",
            date: moment(post.date).locale('zh-cn').format(),
            day: moment(post.date).locale('zh-cn').format('D'),
            month: moment(post.date).locale('zh-cn').format('MMMM'),
            authorLink: post.author
                && post.author.link
                || hexo.config.author
                && hexo.config.author.link
                || hexo.theme.author
                && hexo.theme.author.link
                || '/',
            authorNick: post.author
                && post.author.nick
                || hexo.config.author
                && hexo.config.author.name
                || hexo.theme.author
                && hexo.theme.author.name
                || 'unknow'
        };
    });
    return [{
        path: pathFn.join(lunrPath, "all.json"),
        data: JSON.stringify({ store: store })
    }];
});
