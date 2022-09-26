/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/about/index.html","419ae0960529b3f1e1f75d83076b1485"],["/archives/2017/01/index.html","c56c40ccb27c14fd54e866c2c19ffa8f"],["/archives/2017/03/index.html","067a50ae536c1803b1528fde31c36a3b"],["/archives/2017/05/index.html","fd275dc2c4a7f453076220547d5b02b0"],["/archives/2017/07/index.html","74b7d58fdc0f26ac0f90e5d7ef2d9d8a"],["/archives/2017/08/index.html","fd5d2b3e24366a14215a55e3f2edcb30"],["/archives/2017/09/index.html","0adbeae7afcba79308d7e730f1bd0989"],["/archives/2017/10/index.html","683701e2a3317607bf5d50a5b6e063c9"],["/archives/2017/11/index.html","ea4c20150d55cf34c62268cd58bfb3e1"],["/archives/2017/12/index.html","e4bc8cbe4aac9d83b62320a9edc61cb6"],["/archives/2017/index.html","08f4c4adbfe974986f6fe6dcb75e33dc"],["/archives/2017/page/2/index.html","0ade66b8bf9f6109398b595b693e0153"],["/archives/2018/01/index.html","48a5aaf92b0e983a8fbe2b8e6c4da4e0"],["/archives/2018/02/index.html","34934df8d257d50150b0fe3fb2238767"],["/archives/2018/03/index.html","bfb555d1f3e3df8842af7ca2156aabcd"],["/archives/2018/04/index.html","cc52cb220dd83fdebf27ae1cbb83124c"],["/archives/2018/05/index.html","5fe6ad354c7b4ecc76118dbb4271315c"],["/archives/2018/06/index.html","776b9f202954a4de433fad8f6753f9c0"],["/archives/2018/07/index.html","ae3322994329eaa44e6f5ff60c451df0"],["/archives/2018/08/index.html","8605f30bf81196ca339a5aece65e6d35"],["/archives/2018/09/index.html","0672b94dcc133cf3734c7123c1f44716"],["/archives/2018/10/index.html","f1df3f8d195306c2592fb48152ba2ea4"],["/archives/2018/11/index.html","d6bff3defcc090376cfc003cfb64cd1b"],["/archives/2018/index.html","ff91262a3c4cbedf2260d86f1b3bc642"],["/archives/2018/page/2/index.html","f2efb893285f2cfc9e3ae2478cf2934a"],["/archives/2018/page/3/index.html","164277c98573c0d462d4e1923a9a5a35"],["/archives/2018/page/4/index.html","138d0f5841412c620b07f42f2d97be67"],["/archives/2018/page/5/index.html","e02b4d4f0fc61b97a60065b7734e093f"],["/archives/2019/01/index.html","09cf12b106ef6652db5ce5874a90ddf9"],["/archives/2019/02/index.html","adc2a7fba230b75377435d2962806357"],["/archives/2019/03/index.html","01bcb5fe2a18b13a6d8713f939fca868"],["/archives/2019/04/index.html","8c61ae625dbf3296e3ebbe53168021d2"],["/archives/2019/08/index.html","87c163c708789245baa053f9d00c1e7f"],["/archives/2019/09/index.html","26cc508bdafd9f636adee65149352573"],["/archives/2019/10/index.html","1a997a91299d4e8cf88f970f4781eb10"],["/archives/2019/12/index.html","2426497b36eb3e08fde664bccbd535b8"],["/archives/2019/index.html","0e8e9dbe17f8511ac04b940760ecfb05"],["/archives/2019/page/2/index.html","bacff6eebecb4152ac4e681e87027ab4"],["/archives/2020/01/index.html","f569f3f74f7f1f822a99f1085ccc16be"],["/archives/2020/02/index.html","7c2eebd137d91172cba54ca5ebd5d9d8"],["/archives/2020/03/index.html","25564a4cdf18cd82aeac49a5ca2ac035"],["/archives/2020/05/index.html","a4522eba77476646d0e924e618be334e"],["/archives/2020/06/index.html","8c8a0e1f104d212e98cb07d03d39509e"],["/archives/2020/07/index.html","40823de05e33df0517510ac12cf8dd7a"],["/archives/2020/08/index.html","b4c35e0dcba223ff69f3fe9fc36aa34a"],["/archives/2020/10/index.html","1b52ab0e628ce36c4f0e356bd6047214"],["/archives/2020/11/index.html","5671c1468769564292d443df188ade62"],["/archives/2020/12/index.html","741854c4fc43fc794aed7f49ddc5bbcb"],["/archives/2020/index.html","fc7945bc916b06551d1721e48e96edb7"],["/archives/2020/page/2/index.html","0487be466c9789fbf0e93b06a7300ce8"],["/archives/2021/02/index.html","0e2a73019c3d075af67391d57eed30ed"],["/archives/2021/05/index.html","3f0ae6b8081468df5cc36fd56f5057d1"],["/archives/2021/index.html","d512412ffa9b2ca6c3d310e1536faf9e"],["/archives/2022/02/index.html","9a8de2902d7f437c889b073a0b33fbb5"],["/archives/2022/07/index.html","94ca824f385546e41b0280b70c098646"],["/archives/2022/index.html","b7e4c5c0bed1f32466d650bf37a99f2d"],["/archives/index.html","8a371c81a8b631eb47752c1a601e156b"],["/archives/page/2/index.html","035f4341a0d88da693011a4d98bdb5ef"],["/archives/page/3/index.html","003b1af112118510fba7bd0f16b916ef"],["/archives/page/4/index.html","5d703be3ba0786d2b9400a935b16f44d"],["/archives/page/5/index.html","dcde2c9086f7ae5efb7dca8cdeda78ac"],["/archives/page/6/index.html","f150981e545fdd8034ac02f8137d6ebe"],["/archives/page/7/index.html","88ee5e4e4d540714287847e36ad348b0"],["/archives/page/8/index.html","07bc470bcf245c078e5593bbb7185fb2"],["/archives/page/9/index.html","b0a84cbd1e871975afe433830eff8a4d"],["/categories/Spring系列专题/index.html","7132cbc14370251563996ea5936ece64"],["/categories/index.html","69f342897a4463a4999bde5e45d27671"],["/categories/大数据/index.html","6c246c310deb51a71645e9135d77d63f"],["/categories/夯实Java基础/index.html","760a01bde74b62426b68475101d4d73d"],["/categories/夯实Java基础/page/2/index.html","5e37eb54f097af7f72c0d9f10035b941"],["/categories/实战总结/index.html","7833d77097b1f742038f032db8d6517a"],["/categories/工具/index.html","693c4b4910de50533062034e6590de6f"],["/categories/操作系统/index.html","a889142ee70ef51ade8bff6373daa260"],["/categories/杂七杂八/index.html","e384524132bd511fd5aa77ed331e7776"],["/categories/框架与中间件/index.html","2b578ab093630630b7824898a5777055"],["/categories/框架与中间件/page/2/index.html","319eb73a5afea87bcb4b6696dce2b0ff"],["/categories/设计模式专题/index.html","7661f88b5e8b67eb1aef4cb37b06aeb6"],["/categories/设计模式专题/page/2/index.html","16e8dc7a514ed63198c832c87e8a7ca2"],["/categories/读书笔记/index.html","997ee2cf649293c3c9fa0029e45ec577"],["/categories/转载/index.html","b906be93f9a8d49950b74edebf3ee340"],["/fonts/iconfont.eot","3fdccc279c6fc8af79d5113865d6fd59"],["/fonts/iconfont.svg","3e969604074b7369f3738f1bfdb9472d"],["/fonts/iconfont.ttf","34e141c95d70fbc6429318aed1564d30"],["/fonts/iconfont.woff","d658c2b8af244e42eb9685090c1cf81c"],["/index.html","47abc277e1922cd8c6c96635fecad5e0"],["/js/common.js","4d7e76cda889ec3026b720d3832e3007"],["/js/common/animation.js","6deb756f3e55bf2a44ac635264a3bfde"],["/js/common/pack.js","8f2fc3e4e123f9b4e13a0808d91b63cd"],["/js/common/utils.js","992ad57e59305868c11373456e7c95c2"],["/js/gitalk.css","d41d8cd98f00b204e9800998ecf8427e"],["/js/gitalk.min.js","c021128f9877e5b5b2bcb45bec63e814"],["/js/layout/back-top.js","5b5bf97d3db85ee9894157587424aaed"],["/js/layout/header.js","b1a6a9fe66eda5afbc03b944379f1761"],["/js/layout/loading.js","84fc204c676c2ac38dce5fa3dbf27e85"],["/js/layout/post.js","06e19e83dca0fa5d52d507f04b8ad2ca"],["/js/layout/sidebar.js","b52291ca57dc284e475009c6d26b4358"],["/js/libs/axios.min.js","e9e48cd857bfc7874945ac764c6e6495"],["/js/libs/lunr.min.js","15ef268d2498a92db189f3e2e34c8fd3"],["/js/md5.min.js","dcd3361e674f4400b5f85a3e6e78d304"],["/js/page/post.js","5d111a40c37de09379c736b1d7bbd8de"],["/js/page/search.js","6026bab9ee7800249be409a0414d6610"],["/js/search.js","308eb816e87c00407fd44676f18cb812"],["/live2dw/lib/L2Dwidget.0.min.js","32973883fcac0a9ae6cc79c0ea25fda2"],["/live2dw/lib/L2Dwidget.min.js","094cbace49a39548bed64abff5988b05"],["/page/2/index.html","9764fad6bbe0ffade34174b450381099"],["/page/3/index.html","149516de949dbe6260f37953912cd03d"],["/page/4/index.html","a0943ba50635460cf7c8711df69e9247"],["/page/5/index.html","9e4ac78f04974af94ef9f203d6e5ce69"],["/page/6/index.html","1c0c8fa639fef17fdf31dedf9e111743"],["/page/7/index.html","99b85f621f17916cb9bf8e47ce7e5905"],["/page/8/index.html","6293df3686f185cf07dae308d13da1c1"],["/page/9/index.html","4939aeba7cbe10f8149869cee7041ade"],["/posts/alibaba_code_style_exam.html","f477e3aedb2e8e806e607ab67c208868"],["/posts/alibaba_frank_code_style.html","a49e5fb4c15e1f4dcde1d5dba676babd"],["/posts/animal_crossing_recommed.html","4360820218486b076d0dbfec02369139"],["/posts/anime_recommed.html","36c6ff625c8cb9ef6037f607fb897275"],["/posts/design-patterns-adapter.html","43d77f4e5978c5cd6af9087b9b1c73f7"],["/posts/design-patterns-builder.html","3a6fb7cf991f07172bf31c7ab531af0a"],["/posts/design-patterns-chain-of-responsibility.html","41cd6f45cd021e7a1df98ca50fe3a593"],["/posts/design-patterns-composite.html","a4575b726045ebd93fb8be2bb8125130"],["/posts/design-patterns-decorator-model.html","c645c52b5f5efc0933bf369fef71fd3f"],["/posts/design-patterns-event_design.html","3c40c7d398434e8f7bc4e7bf2f7dbec5"],["/posts/design-patterns-flyweight.html","8733b720c93006d9119b1937c7174ec8"],["/posts/design-patterns-future-callback.html","d267a718c45854930469cd40b8080663"],["/posts/design-patterns-immutable.html","291d2d13fd02450cd753c5ef6aed1162"],["/posts/design-patterns-observer.html","cb4af7b16c4dc1c0236df9f1c86be80f"],["/posts/design-patterns-producer-consumer.html","439af7eee82bce205211e197f35cc94d"],["/posts/design-patterns-proxy.html","71696bc14d5eff15ca1181fdb6a23f00"],["/posts/design-patterns-strategy.html","b0d9a4c388e50a3ff4369485f58412a8"],["/posts/design-patterns-template-method.html","b6908da95121815c096e33cf5defe008"],["/posts/design-patterns-thread-specific-storge.html","9d150b3084bd8a8ede9be5d467cd474a"],["/posts/design-patterns-visitor.html","22f6237603f225928362492f5a52871c"],["/posts/developer_core_ability.html","24ea78f4237a5985da90382bb3deed38"],["/posts/framework-apache-common-cli.html","f2e809a2352ba1ff4a3e1ba90bafe335"],["/posts/framework-double-extension.html","bd285aeae5d9ed01954c25af6e3af568"],["/posts/framework-double-loadbalance.html","3559c8d880fe72307bf11aeb7cd4bc51"],["/posts/framework-double-replace.html","ee45dbb2b921ff2c9711833d3434b166"],["/posts/framework-guava-bloomfilter.html","7f7ab3315f1edc2ba3ed2a1f96ebfdaa"],["/posts/framework-hadoop-map-reduce.html","c8a0507a7104f718901762e7a62de52d"],["/posts/framework-hive-study1.html","11dacab5a52ba2cb09f1fb02bdd842ae"],["/posts/framework-hive-study2.html","a87879eef019069fba7614e5a65e24d3"],["/posts/framework-mockito.html","e7f25a24b5d09f49a6ef5f8dfc93bd73"],["/posts/framework-mybatis-mapper-proxy.html","18dc98b820f5b6d471b24144223cf0c7"],["/posts/framework-mybatis-result-set-handler.html","181d55fccaf8b0aa3b60c30f376b7d14"],["/posts/framework-mybatis-sql-analysis.html","35bd1ac0eea5a92234c969451c4b4292"],["/posts/framework-mybatis-sql-session.html","5320697b4cffe4d405a529f50370cf87"],["/posts/framework-mybatis-type-handler.html","9118250fc688dc51b35d21aa6e9684f2"],["/posts/framework-netty-bytebuf.html","3002ce4d47fc66d4c4566615e61d26ed"],["/posts/framework-netty-half-packet.html","3457163661c9353b68c0add27b5460a5"],["/posts/framework-netty-reactor-model.html","7b92e415e5393d09f165a94834d09265"],["/posts/framework-spring-apo-ioc.html","01ed6a958cedcb1f569720b87c06a175"],["/posts/framework-spring-autoconfig.html","ecd9ca5b963f0b07f7e351787e879bb4"],["/posts/framework-spring-cache.html","df13e8b8300a503f00450df8c0ed3161"],["/posts/framework-spring-jar-in-jar.html","61a722d9e3b61b89c79faf9f61887f3f"],["/posts/framework-spring-mvc-params.html","d34bf43b4de9af934af1997b50c65f82"],["/posts/framework-spring-schedule.html","dd78059bdc0efe857b797dcbb1fc7603"],["/posts/framework-springmvc-exception.html","c0d21d4d1f24f09321b1914d5c93df9e"],["/posts/framework-springmvc-framework.html","666c17b2aab0a118135d7f40b1992109"],["/posts/framework-springmvc-request.html","2840e7139dad944731ddc5300a5822e3"],["/posts/framework-springmvc-return.html","e43557eca9520114d2dbe710ae491dfc"],["/posts/hello-world.html","a4f0fc3059385fc3ca9b98a04b842cd2"],["/posts/idea_plugin_decompile.html","96a772cdf0131a33daaf76c73186666c"],["/posts/java-string-pool.html","9c340c6a98cd6940fb8466bad53556d1"],["/posts/java_abstract_interface.html","05241233f2f61d4545509ff31f4c42e2"],["/posts/java_box_unbox.html","b2a78d1b7c69acc9bf3c76d1354d1cf4"],["/posts/java_cas.html","20e2fe8619fc6ee878cc01d6c1d0c736"],["/posts/java_classloader.html","e334be5018ad426f551ae9a13ca7a05c"],["/posts/java_close_file.html","384f5d9b870910a832c1d59395e0cb7c"],["/posts/java_deadlock.html","59c573b9d77a9f77752db8596a4a7a43"],["/posts/java_deque.html","914cdfddb92eedddfa6df3b6b2f00308"],["/posts/java_enum.html","218383ad0195a16a58f7edd80a3a96c3"],["/posts/java_longadder.html","ecd1961ef07cb67d44350d3339115ab0"],["/posts/java_metaspace.html","3a9ac0f286dfdf8aaf627d3c6af39d01"],["/posts/java_readwritelock.html","61305c795c7da4f3ac93113e899c34a3"],["/posts/java_reference.html","fcc6d5f2721d7faff031c9b4f295bfaf"],["/posts/java_serializable.html","8b265f5c6e83d06f9356b2a92f89e9ac"],["/posts/java_stream1.html","73b2a595c9ac867f340b35078131c20d"],["/posts/java_stream2.html","7b8365c54bae357d7a58e9f131af2e27"],["/posts/java_stream3.html","182eb384eb01fc3bb1395eee8972a866"],["/posts/java_stringbuilder.html","5ddae11b5b5d34ba8b33033953f4e123"],["/posts/java_threadlocal.html","aec19fbaf5cd72d02e0d4de86704c025"],["/posts/java_threadpool_completablefuture.html","a86cecca0dfc40259a665f481e50517e"],["/posts/job_interview_2017.html","c74650eb2823d639315c01f0bb6b73d2"],["/posts/job_interview_2018.html","c61fa4a4a1e237a8ff276f118bb83972"],["/posts/linux-expect_script.html","3e1036da2865eb208ccdf9788bcdb6a0"],["/posts/linux_tcp_close_wait.html","3659d4984c2591d4b5bfe2fd0e623732"],["/posts/mysql-distributed-lock.html","02b56825b3525984510469b2ad8e79a0"],["/posts/mysql-index-guide.html","5b3d5e275e8b70006e2e83184aa4b33c"],["/posts/mysql-lock-handle.html","5ecdbef5105c6e5eded1e2044e84263d"],["/posts/osx_app_switcher.html","8ea49d67d7ee3aaf8ba3f0799a6089de"],["/posts/osx_install.html","89334d90d0dd47129a336e7ffdb22c3f"],["/posts/readnote-http.html","9e05514d82391e6ac4a6ae4caca44c0b"],["/posts/readnote-maven_in_action.html","6be39b32b34428a00c4f59670b5ab731"],["/posts/readnote-mysql-45-summary.html","9dbf208c492ba721696778e09aa66e80"],["/posts/readnote-pro-git.html","be07fed05d430496d58a133851b1461a"],["/posts/readnote-regex.html","e79d866cecb5e1e26386dc814cecb798"],["/posts/storage-ssd.html","bb2e3b4fef794d49a82425816d24d099"],["/posts/tools-alfred-cmd-search.html","15ba193768a3c14adf89b690b009bfce"],["/posts/tools-cors-anywhere.html","64e6ddbc4bdca6aff69abac53322c6df"],["/posts/tools-dalgen.html","9aadfecd4e79ae217087ea365b505bd1"],["/posts/tools-excel.html","db74a520ddfb686f1cbce2c365f3ae9a"],["/posts/tools-frp.html","d887db8c333395ea5f4cb9ad476fc459"],["/posts/tools-hosts.html","0297b2d027b6c38c7dd858f5bb1e4456"],["/posts/tools-time-convert.html","4def489156201899c872156fd14868f2"],["/posts/tools-v2ray-cloudflare.html","8b81a60ee3012aecb2b5e90a020b07ea"],["/posts/work-design-algorithm-recursive.html","c7e123929ee811fdb17affcbadd1dd4d"],["/posts/work-design-binary.html","4f42845cd3e7c89ff0892f19ee33e218"],["/posts/work-design-command-model-in-action.html","4d73ef1d67eec6fa3bf2601b0f6b8ad2"],["/posts/work-design-common-selected.html","d9a1a443c68a5434fd547aad1a6aeda6"],["/posts/work-design-java8-timezone.html","e0d75feb7302c360a69abe876d83afd2"],["/posts/work-design-jwt.html","da3f51cf6619c9cc67d0628c8db77872"],["/posts/work-design-microkernel-biz.html","ef001d1c2882ebfcd164ecb3535776b3"],["/posts/work-design-velocity-sql-inject.html","41c2077edb0595fd05909b72b52c5855"],["/posts/work-how_config_log.html","ba9c7e698fbef7cbf3ed789ac7749d73"],["/posts/work_how_design_user_login.html","21278ac91b6eb2e03d85d7273e7e6451"],["/scss/base/index.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/about.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/archive.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/category.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/error.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/index.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/post.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/search.css","d41d8cd98f00b204e9800998ecf8427e"],["/scss/views/page/tag.css","d41d8cd98f00b204e9800998ecf8427e"],["/search/index.html","521ee82002e71357d01b0e9e27fe7f73"],["/tags/Alfred/index.html","44b07901beee5584d880650fc7b08925"],["/tags/Apache/index.html","04386c6d9eb220f0a0337e3004cb0914"],["/tags/Dubbo/index.html","35ad46ad2aa4e393cab640791d66a514"],["/tags/Guava/index.html","1819ff6efb066fe1c0dcd2ea9f8b183a"],["/tags/IntelliJ/index.html","863f6775236d59c1bd64f235407e5b6d"],["/tags/JUC/index.html","fd6e564eb84892834be0a80d47d04834"],["/tags/JWT/index.html","82acffce107bba9b82a73c05de1f753c"],["/tags/Java/index.html","fe7f9f71ddb02c9d8a4e570ae06e57c1"],["/tags/Java/page/2/index.html","f48b2af8b4f78c145ee9e84c00c8ffaa"],["/tags/Mockito/index.html","b882f95a6d06c8f2fa3941ec6644a3f0"],["/tags/MySQL/index.html","380a7a9c6e7077aa79a29a413e5e91bc"],["/tags/Mybatis/index.html","59b3e00a52841ae10574982d322bd599"],["/tags/Netty/index.html","c36b9780e70221c9812ea315096fbe3d"],["/tags/OSX/index.html","2e11a816a148b2b9e4e9a126ea596ee6"],["/tags/Spring/index.html","186dc90daf73e8fcdcdd923f600eaaba"],["/tags/index.html","9eb159d35dcded1b4cc757d921687483"],["/tags/动漫/index.html","e63952cc0e946b76872a186f27154b3a"],["/tags/大数据/index.html","497089ead062c105a61702a408396487"],["/tags/实战/index.html","f92e180daa002d631e3001374e566abe"],["/tags/工作/index.html","3c460c31f28edcaee8bfba62b69618e3"],["/tags/游戏/index.html","a1ce36df6a5eac1d93f026932e578cab"],["/tags/算法/index.html","2d901a04348a1721e3d292f8f476e1f8"],["/tags/设计模式/index.html","8e9db575ff29b24aaf67322444eb520c"],["/tags/设计模式/page/2/index.html","e8acb8d5cbe399f9e300c061338629f3"],["/tags/读书笔记/index.html","2dabc65306b695040a093bb4ea05aef2"],["/tags/转载/index.html","9af11a9be15d90403d183829d5df087b"],["/tags/轮子/index.html","de05f6abe5db7c23ccb8d25b641f3942"],["/works/index.html","2586a612b704f1d83bdfa525d2dbeb54"]];
var cacheName = 'sw-precache-v3--' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function(originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function(originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function(originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function(whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function(originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});


// *** Start of auto-included sw-toolbox code. ***
/* 
 Copyright 2016 Google Inc. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.toolbox=e()}}(function(){return function e(t,n,r){function o(c,s){if(!n[c]){if(!t[c]){var a="function"==typeof require&&require;if(!s&&a)return a(c,!0);if(i)return i(c,!0);var u=new Error("Cannot find module '"+c+"'");throw u.code="MODULE_NOT_FOUND",u}var f=n[c]={exports:{}};t[c][0].call(f.exports,function(e){var n=t[c][1][e];return o(n?n:e)},f,f.exports,e,t,n,r)}return n[c].exports}for(var i="function"==typeof require&&require,c=0;c<r.length;c++)o(r[c]);return o}({1:[function(e,t,n){"use strict";function r(e,t){t=t||{};var n=t.debug||m.debug;n&&console.log("[sw-toolbox] "+e)}function o(e){var t;return e&&e.cache&&(t=e.cache.name),t=t||m.cache.name,caches.open(t)}function i(e,t){t=t||{};var n=t.successResponses||m.successResponses;return fetch(e.clone()).then(function(r){return"GET"===e.method&&n.test(r.status)&&o(t).then(function(n){n.put(e,r).then(function(){var r=t.cache||m.cache;(r.maxEntries||r.maxAgeSeconds)&&r.name&&c(e,n,r)})}),r.clone()})}function c(e,t,n){var r=s.bind(null,e,t,n);d=d?d.then(r):r()}function s(e,t,n){var o=e.url,i=n.maxAgeSeconds,c=n.maxEntries,s=n.name,a=Date.now();return r("Updating LRU order for "+o+". Max entries is "+c+", max age is "+i),g.getDb(s).then(function(e){return g.setTimestampForUrl(e,o,a)}).then(function(e){return g.expireEntries(e,c,i,a)}).then(function(e){r("Successfully updated IDB.");var n=e.map(function(e){return t.delete(e)});return Promise.all(n).then(function(){r("Done with cache cleanup.")})}).catch(function(e){r(e)})}function a(e,t,n){return r("Renaming cache: ["+e+"] to ["+t+"]",n),caches.delete(t).then(function(){return Promise.all([caches.open(e),caches.open(t)]).then(function(t){var n=t[0],r=t[1];return n.keys().then(function(e){return Promise.all(e.map(function(e){return n.match(e).then(function(t){return r.put(e,t)})}))}).then(function(){return caches.delete(e)})})})}function u(e,t){return o(t).then(function(t){return t.add(e)})}function f(e,t){return o(t).then(function(t){return t.delete(e)})}function h(e){e instanceof Promise||p(e),m.preCacheItems=m.preCacheItems.concat(e)}function p(e){var t=Array.isArray(e);if(t&&e.forEach(function(e){"string"==typeof e||e instanceof Request||(t=!1)}),!t)throw new TypeError("The precache method expects either an array of strings and/or Requests or a Promise that resolves to an array of strings and/or Requests.");return e}function l(e,t,n){if(!e)return!1;if(t){var r=e.headers.get("date");if(r){var o=new Date(r);if(o.getTime()+1e3*t<n)return!1}}return!0}var d,m=e("./options"),g=e("./idb-cache-expiration");t.exports={debug:r,fetchAndCache:i,openCache:o,renameCache:a,cache:u,uncache:f,precache:h,validatePrecacheInput:p,isResponseFresh:l}},{"./idb-cache-expiration":2,"./options":4}],2:[function(e,t,n){"use strict";function r(e){return new Promise(function(t,n){var r=indexedDB.open(u+e,f);r.onupgradeneeded=function(){var e=r.result.createObjectStore(h,{keyPath:p});e.createIndex(l,l,{unique:!1})},r.onsuccess=function(){t(r.result)},r.onerror=function(){n(r.error)}})}function o(e){return e in d||(d[e]=r(e)),d[e]}function i(e,t,n){return new Promise(function(r,o){var i=e.transaction(h,"readwrite"),c=i.objectStore(h);c.put({url:t,timestamp:n}),i.oncomplete=function(){r(e)},i.onabort=function(){o(i.error)}})}function c(e,t,n){return t?new Promise(function(r,o){var i=1e3*t,c=[],s=e.transaction(h,"readwrite"),a=s.objectStore(h),u=a.index(l);u.openCursor().onsuccess=function(e){var t=e.target.result;if(t&&n-i>t.value[l]){var r=t.value[p];c.push(r),a.delete(r),t.continue()}},s.oncomplete=function(){r(c)},s.onabort=o}):Promise.resolve([])}function s(e,t){return t?new Promise(function(n,r){var o=[],i=e.transaction(h,"readwrite"),c=i.objectStore(h),s=c.index(l),a=s.count();s.count().onsuccess=function(){var e=a.result;e>t&&(s.openCursor().onsuccess=function(n){var r=n.target.result;if(r){var i=r.value[p];o.push(i),c.delete(i),e-o.length>t&&r.continue()}})},i.oncomplete=function(){n(o)},i.onabort=r}):Promise.resolve([])}function a(e,t,n,r){return c(e,n,r).then(function(n){return s(e,t).then(function(e){return n.concat(e)})})}var u="sw-toolbox-",f=1,h="store",p="url",l="timestamp",d={};t.exports={getDb:o,setTimestampForUrl:i,expireEntries:a}},{}],3:[function(e,t,n){"use strict";function r(e){var t=a.match(e.request);t?e.respondWith(t(e.request)):a.default&&"GET"===e.request.method&&0===e.request.url.indexOf("http")&&e.respondWith(a.default(e.request))}function o(e){s.debug("activate event fired");var t=u.cache.name+"$$$inactive$$$";e.waitUntil(s.renameCache(t,u.cache.name))}function i(e){return e.reduce(function(e,t){return e.concat(t)},[])}function c(e){var t=u.cache.name+"$$$inactive$$$";s.debug("install event fired"),s.debug("creating cache ["+t+"]"),e.waitUntil(s.openCache({cache:{name:t}}).then(function(e){return Promise.all(u.preCacheItems).then(i).then(s.validatePrecacheInput).then(function(t){return s.debug("preCache list: "+(t.join(", ")||"(none)")),e.addAll(t)})}))}e("serviceworker-cache-polyfill");var s=e("./helpers"),a=e("./router"),u=e("./options");t.exports={fetchListener:r,activateListener:o,installListener:c}},{"./helpers":1,"./options":4,"./router":6,"serviceworker-cache-polyfill":16}],4:[function(e,t,n){"use strict";var r;r=self.registration?self.registration.scope:self.scope||new URL("./",self.location).href,t.exports={cache:{name:"$$$toolbox-cache$$$"+r+"$$$",maxAgeSeconds:null,maxEntries:null},debug:!1,networkTimeoutSeconds:null,preCacheItems:[],successResponses:/^0|([123]\d\d)|(40[14567])|410$/}},{}],5:[function(e,t,n){"use strict";var r=new URL("./",self.location),o=r.pathname,i=e("path-to-regexp"),c=function(e,t,n,r){t instanceof RegExp?this.fullUrlRegExp=t:(0!==t.indexOf("/")&&(t=o+t),this.keys=[],this.regexp=i(t,this.keys)),this.method=e,this.options=r,this.handler=n};c.prototype.makeHandler=function(e){var t;if(this.regexp){var n=this.regexp.exec(e);t={},this.keys.forEach(function(e,r){t[e.name]=n[r+1]})}return function(e){return this.handler(e,t,this.options)}.bind(this)},t.exports=c},{"path-to-regexp":15}],6:[function(e,t,n){"use strict";function r(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}var o=e("./route"),i=e("./helpers"),c=function(e,t){for(var n=e.entries(),r=n.next(),o=[];!r.done;){var i=new RegExp(r.value[0]);i.test(t)&&o.push(r.value[1]),r=n.next()}return o},s=function(){this.routes=new Map,this.routes.set(RegExp,new Map),this.default=null};["get","post","put","delete","head","any"].forEach(function(e){s.prototype[e]=function(t,n,r){return this.add(e,t,n,r)}}),s.prototype.add=function(e,t,n,c){c=c||{};var s;t instanceof RegExp?s=RegExp:(s=c.origin||self.location.origin,s=s instanceof RegExp?s.source:r(s)),e=e.toLowerCase();var a=new o(e,t,n,c);this.routes.has(s)||this.routes.set(s,new Map);var u=this.routes.get(s);u.has(e)||u.set(e,new Map);var f=u.get(e),h=a.regexp||a.fullUrlRegExp;f.has(h.source)&&i.debug('"'+t+'" resolves to same regex as existing route.'),f.set(h.source,a)},s.prototype.matchMethod=function(e,t){var n=new URL(t),r=n.origin,o=n.pathname;return this._match(e,c(this.routes,r),o)||this._match(e,[this.routes.get(RegExp)],t)},s.prototype._match=function(e,t,n){if(0===t.length)return null;for(var r=0;r<t.length;r++){var o=t[r],i=o&&o.get(e.toLowerCase());if(i){var s=c(i,n);if(s.length>0)return s[0].makeHandler(n)}}return null},s.prototype.match=function(e){return this.matchMethod(e.method,e.url)||this.matchMethod("any",e.url)},t.exports=new s},{"./helpers":1,"./route":5}],7:[function(e,t,n){"use strict";function r(e,t,n){return n=n||{},i.debug("Strategy: cache first ["+e.url+"]",n),i.openCache(n).then(function(t){return t.match(e).then(function(t){var r=n.cache||o.cache,c=Date.now();return i.isResponseFresh(t,r.maxAgeSeconds,c)?t:i.fetchAndCache(e,n)})})}var o=e("../options"),i=e("../helpers");t.exports=r},{"../helpers":1,"../options":4}],8:[function(e,t,n){"use strict";function r(e,t,n){return n=n||{},i.debug("Strategy: cache only ["+e.url+"]",n),i.openCache(n).then(function(t){return t.match(e).then(function(e){var t=n.cache||o.cache,r=Date.now();if(i.isResponseFresh(e,t.maxAgeSeconds,r))return e})})}var o=e("../options"),i=e("../helpers");t.exports=r},{"../helpers":1,"../options":4}],9:[function(e,t,n){"use strict";function r(e,t,n){return o.debug("Strategy: fastest ["+e.url+"]",n),new Promise(function(r,c){var s=!1,a=[],u=function(e){a.push(e.toString()),s?c(new Error('Both cache and network failed: "'+a.join('", "')+'"')):s=!0},f=function(e){e instanceof Response?r(e):u("No result returned")};o.fetchAndCache(e.clone(),n).then(f,u),i(e,t,n).then(f,u)})}var o=e("../helpers"),i=e("./cacheOnly");t.exports=r},{"../helpers":1,"./cacheOnly":8}],10:[function(e,t,n){t.exports={networkOnly:e("./networkOnly"),networkFirst:e("./networkFirst"),cacheOnly:e("./cacheOnly"),cacheFirst:e("./cacheFirst"),fastest:e("./fastest")}},{"./cacheFirst":7,"./cacheOnly":8,"./fastest":9,"./networkFirst":11,"./networkOnly":12}],11:[function(e,t,n){"use strict";function r(e,t,n){n=n||{};var r=n.successResponses||o.successResponses,c=n.networkTimeoutSeconds||o.networkTimeoutSeconds;return i.debug("Strategy: network first ["+e.url+"]",n),i.openCache(n).then(function(t){var s,a,u=[];if(c){var f=new Promise(function(r){s=setTimeout(function(){t.match(e).then(function(e){var t=n.cache||o.cache,c=Date.now(),s=t.maxAgeSeconds;i.isResponseFresh(e,s,c)&&r(e)})},1e3*c)});u.push(f)}var h=i.fetchAndCache(e,n).then(function(e){if(s&&clearTimeout(s),r.test(e.status))return e;throw i.debug("Response was an HTTP error: "+e.statusText,n),a=e,new Error("Bad response")}).catch(function(r){return i.debug("Network or response error, fallback to cache ["+e.url+"]",n),t.match(e).then(function(e){if(e)return e;if(a)return a;throw r})});return u.push(h),Promise.race(u)})}var o=e("../options"),i=e("../helpers");t.exports=r},{"../helpers":1,"../options":4}],12:[function(e,t,n){"use strict";function r(e,t,n){return o.debug("Strategy: network only ["+e.url+"]",n),fetch(e)}var o=e("../helpers");t.exports=r},{"../helpers":1}],13:[function(e,t,n){"use strict";var r=e("./options"),o=e("./router"),i=e("./helpers"),c=e("./strategies"),s=e("./listeners");i.debug("Service Worker Toolbox is loading"),self.addEventListener("install",s.installListener),self.addEventListener("activate",s.activateListener),self.addEventListener("fetch",s.fetchListener),t.exports={networkOnly:c.networkOnly,networkFirst:c.networkFirst,cacheOnly:c.cacheOnly,cacheFirst:c.cacheFirst,fastest:c.fastest,router:o,options:r,cache:i.cache,uncache:i.uncache,precache:i.precache}},{"./helpers":1,"./listeners":3,"./options":4,"./router":6,"./strategies":10}],14:[function(e,t,n){t.exports=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)}},{}],15:[function(e,t,n){function r(e,t){for(var n,r=[],o=0,i=0,c="",s=t&&t.delimiter||"/";null!=(n=x.exec(e));){var f=n[0],h=n[1],p=n.index;if(c+=e.slice(i,p),i=p+f.length,h)c+=h[1];else{var l=e[i],d=n[2],m=n[3],g=n[4],v=n[5],w=n[6],y=n[7];c&&(r.push(c),c="");var b=null!=d&&null!=l&&l!==d,E="+"===w||"*"===w,R="?"===w||"*"===w,k=n[2]||s,$=g||v;r.push({name:m||o++,prefix:d||"",delimiter:k,optional:R,repeat:E,partial:b,asterisk:!!y,pattern:$?u($):y?".*":"[^"+a(k)+"]+?"})}}return i<e.length&&(c+=e.substr(i)),c&&r.push(c),r}function o(e,t){return s(r(e,t))}function i(e){return encodeURI(e).replace(/[\/?#]/g,function(e){return"%"+e.charCodeAt(0).toString(16).toUpperCase()})}function c(e){return encodeURI(e).replace(/[?#]/g,function(e){return"%"+e.charCodeAt(0).toString(16).toUpperCase()})}function s(e){for(var t=new Array(e.length),n=0;n<e.length;n++)"object"==typeof e[n]&&(t[n]=new RegExp("^(?:"+e[n].pattern+")$"));return function(n,r){for(var o="",s=n||{},a=r||{},u=a.pretty?i:encodeURIComponent,f=0;f<e.length;f++){var h=e[f];if("string"!=typeof h){var p,l=s[h.name];if(null==l){if(h.optional){h.partial&&(o+=h.prefix);continue}throw new TypeError('Expected "'+h.name+'" to be defined')}if(v(l)){if(!h.repeat)throw new TypeError('Expected "'+h.name+'" to not repeat, but received `'+JSON.stringify(l)+"`");if(0===l.length){if(h.optional)continue;throw new TypeError('Expected "'+h.name+'" to not be empty')}for(var d=0;d<l.length;d++){if(p=u(l[d]),!t[f].test(p))throw new TypeError('Expected all "'+h.name+'" to match "'+h.pattern+'", but received `'+JSON.stringify(p)+"`");o+=(0===d?h.prefix:h.delimiter)+p}}else{if(p=h.asterisk?c(l):u(l),!t[f].test(p))throw new TypeError('Expected "'+h.name+'" to match "'+h.pattern+'", but received "'+p+'"');o+=h.prefix+p}}else o+=h}return o}}function a(e){return e.replace(/([.+*?=^!:${}()[\]|\/\\])/g,"\\$1")}function u(e){return e.replace(/([=!:$\/()])/g,"\\$1")}function f(e,t){return e.keys=t,e}function h(e){return e.sensitive?"":"i"}function p(e,t){var n=e.source.match(/\((?!\?)/g);if(n)for(var r=0;r<n.length;r++)t.push({name:r,prefix:null,delimiter:null,optional:!1,repeat:!1,partial:!1,asterisk:!1,pattern:null});return f(e,t)}function l(e,t,n){for(var r=[],o=0;o<e.length;o++)r.push(g(e[o],t,n).source);var i=new RegExp("(?:"+r.join("|")+")",h(n));return f(i,t)}function d(e,t,n){return m(r(e,n),t,n)}function m(e,t,n){v(t)||(n=t||n,t=[]),n=n||{};for(var r=n.strict,o=n.end!==!1,i="",c=0;c<e.length;c++){var s=e[c];if("string"==typeof s)i+=a(s);else{var u=a(s.prefix),p="(?:"+s.pattern+")";t.push(s),s.repeat&&(p+="(?:"+u+p+")*"),p=s.optional?s.partial?u+"("+p+")?":"(?:"+u+"("+p+"))?":u+"("+p+")",i+=p}}var l=a(n.delimiter||"/"),d=i.slice(-l.length)===l;return r||(i=(d?i.slice(0,-l.length):i)+"(?:"+l+"(?=$))?"),i+=o?"$":r&&d?"":"(?="+l+"|$)",f(new RegExp("^"+i,h(n)),t)}function g(e,t,n){return v(t)||(n=t||n,t=[]),n=n||{},e instanceof RegExp?p(e,t):v(e)?l(e,t,n):d(e,t,n)}var v=e("isarray");t.exports=g,t.exports.parse=r,t.exports.compile=o,t.exports.tokensToFunction=s,t.exports.tokensToRegExp=m;var x=new RegExp(["(\\\\.)","([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))"].join("|"),"g")},{isarray:14}],16:[function(e,t,n){!function(){var e=Cache.prototype.addAll,t=navigator.userAgent.match(/(Firefox|Chrome)\/(\d+\.)/);if(t)var n=t[1],r=parseInt(t[2]);e&&(!t||"Firefox"===n&&r>=46||"Chrome"===n&&r>=50)||(Cache.prototype.addAll=function(e){function t(e){this.name="NetworkError",this.code=19,this.message=e}var n=this;return t.prototype=Object.create(Error.prototype),Promise.resolve().then(function(){if(arguments.length<1)throw new TypeError;return e=e.map(function(e){return e instanceof Request?e:String(e)}),Promise.all(e.map(function(e){"string"==typeof e&&(e=new Request(e));var n=new URL(e.url).protocol;if("http:"!==n&&"https:"!==n)throw new t("Invalid scheme");return fetch(e.clone())}))}).then(function(r){if(r.some(function(e){return!e.ok}))throw new t("Incorrect response status");return Promise.all(r.map(function(t,r){return n.put(e[r],t)}))}).then(function(){})},Cache.prototype.add=function(e){return this.addAll([e])})}()},{}]},{},[13])(13)});


// *** End of auto-included sw-toolbox code. ***



// Runtime cache configuration, using the sw-toolbox library.

toolbox.router.get("/^https:\\/\\/imgblog\\.mrdear\\.cn", toolbox.networkOnly, {"origin":"imgblog.mrdear.cn"});
toolbox.router.get("/^https:\\/\\/mrdear.cn\\/$/", toolbox.networkOnly, {"origin":"mrdear.cn"});
toolbox.router.get("/^https:\\/\\/**", toolbox.cacheFirst, {"origin":"mrdear.cn"});




