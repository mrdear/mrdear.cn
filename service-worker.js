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

var precacheConfig = [["/about/index.html","784f67c5b7ba60b76fd23fd09307833a"],["/archives/2017/01/index.html","f9f35e9902f000a8a60952611129adc6"],["/archives/2017/03/index.html","12d01a716c6eb0f06233b4a0e5b72fa9"],["/archives/2017/05/index.html","1853650c26683aceb46f73186ee0970f"],["/archives/2017/07/index.html","51c3ed454083adc3d2a94e0e9a67688e"],["/archives/2017/08/index.html","a3f7965d28afb2a74b6dadf110957783"],["/archives/2017/09/index.html","7055f6c0e3da2306c93e3e64cd6f9c84"],["/archives/2017/10/index.html","cc6406f48d6518e9248ce4c1fab48ee5"],["/archives/2017/11/index.html","cca1a2af1901f15c2ed3ac4cd0674444"],["/archives/2017/12/index.html","aafa9d35a7200ee2c643b362a19c435d"],["/archives/2017/index.html","8ca3dd3d90d494d5dbd5d19882765f85"],["/archives/2017/page/2/index.html","4d70800bd3b49d3f9eeb28632b0bea06"],["/archives/2018/01/index.html","dda01c04b42ed08462d9b909cf804047"],["/archives/2018/02/index.html","fb5f51e5f8c25a84c68a5291bd1761ed"],["/archives/2018/03/index.html","4324d0fd871b1179df6f641522c609dd"],["/archives/2018/04/index.html","6292ce03016313dfcff5b7d250614fa9"],["/archives/2018/05/index.html","1788e934d83af9bea9de565fcba2b469"],["/archives/2018/06/index.html","514dfbfa1dcb8d11ec2840f98d0297ff"],["/archives/2018/07/index.html","3418d7a3474daec1c78b29e4cf3f2801"],["/archives/2018/08/index.html","2b7e1d86f6645c36b1b3001f60807076"],["/archives/2018/09/index.html","7ff0547ca67082d1f074802ce40a6b36"],["/archives/2018/10/index.html","89102861168c7cae16ca3811936282f6"],["/archives/2018/11/index.html","2edae1772a656ae1362297eab9c4d41f"],["/archives/2018/index.html","dae6d2e0f74d8964dc16dc6ede667319"],["/archives/2018/page/2/index.html","4ad1754c81fd512783eec3169feaade0"],["/archives/2018/page/3/index.html","509313218e8b4393ba0b1dc22a8750fa"],["/archives/2018/page/4/index.html","fd3fd999ca8a74853bb4cf909985d17e"],["/archives/2019/01/index.html","6dc5f3b1a35ea01ca61ddda96f6aaaa6"],["/archives/2019/02/index.html","14fc9f3e0a827b95ad0f3ff3f9776276"],["/archives/2019/03/index.html","72d79b2640792566f813d14193aeb014"],["/archives/2019/04/index.html","aa2ba27e147e7c195d5461f1affc89f0"],["/archives/2019/09/index.html","224800f721547faf56101445ce614314"],["/archives/2019/10/index.html","c9bf171c0a88bdb79ec3e718801462dc"],["/archives/2019/12/index.html","65f05756aa6ff196921c23030a8acef6"],["/archives/2019/index.html","938d02513b616091554289783f672e45"],["/archives/2019/page/2/index.html","67fcd3b3b7297395554cfa5b1e75cb27"],["/archives/2020/01/index.html","78710ed3da5af0eefa78857ab3e4ebc6"],["/archives/2020/02/index.html","0ea7910b7f3b4f75cdd3b010545a6ed2"],["/archives/2020/03/index.html","17c1b61d5d74dd8c25424759990f9f35"],["/archives/2020/05/index.html","9e094813d32f4b1959aa8dfe3667683f"],["/archives/2020/06/index.html","bed96ad4958f310138f83ab893ce9ebd"],["/archives/2020/07/index.html","f4d229f2063dc147b098ef65cf85dc73"],["/archives/2020/08/index.html","de341a9bb8ed4a859bd070f54a20e3cb"],["/archives/2020/10/index.html","169cae18e609a0c692f0056f072e2f72"],["/archives/2020/11/index.html","821dbe69602829d5e06c8136cc3ec746"],["/archives/2020/12/index.html","1e1293a9862a745f7d14a4c54a904e4d"],["/archives/2020/index.html","74fdf28405055d8d13b7c2931f7e5f90"],["/archives/2020/page/2/index.html","47e84ef8dc9157f44a859f08c0991517"],["/archives/2021/02/index.html","c133564c87afb48d23729f8cc5fc7091"],["/archives/2021/05/index.html","8bfbc37ac0f152b9587d9fd71a270550"],["/archives/2021/index.html","84aff40248fae49fab968bbe1c8ec516"],["/archives/2022/02/index.html","6c0f6aad0b9df31a24b0d22bb57ae651"],["/archives/2022/07/index.html","4aaed78997e7ff7c473b9f138cab7f19"],["/archives/2022/index.html","803205d8268598a23fa47bc144f56fbf"],["/archives/index.html","49717b7ddc7f498b6d0ef980f4f1a2e2"],["/archives/page/2/index.html","0f4df4800197a385c83541557db6bb13"],["/archives/page/3/index.html","5c7652d970752c4e0bdd8810675979b9"],["/archives/page/4/index.html","14eb4cc90e9040b5742b8f6b2d87134a"],["/archives/page/5/index.html","53b7d6ff528f5c7b56876d712d85b452"],["/archives/page/6/index.html","85309a1456e70106b2c9cecacc2bb84a"],["/archives/page/7/index.html","68c41d613a7a46107ea06b1ae7a5061b"],["/archives/page/8/index.html","07aaf0fd00fc30a3fbd39fcfae6d2be7"],["/categories/Spring系列专题/index.html","aaa5035aceae4891b3cb1ca8386aa328"],["/categories/index.html","f081bad6bfb7678935a626b4b642f8b5"],["/categories/夯实Java基础/index.html","5a24099883a8d84b07e1392823d41466"],["/categories/夯实Java基础/page/2/index.html","fc64df8bf5bb12a0e116bda4ebf44ac6"],["/categories/实战总结/index.html","abb7ead82debf43b68b8a6d66828bb60"],["/categories/工具/index.html","b2fa0401ef38af73153f8f2a3ec17b2b"],["/categories/操作系统/index.html","e061b1c13c074bfcaaeb1fc6ac451533"],["/categories/杂七杂八/index.html","2c559dfeadd112603056ac3baf53a7a3"],["/categories/框架与中间件/index.html","4e216f3eacd991ee06134fce46d3d7b4"],["/categories/框架与中间件/page/2/index.html","d82c71d2d7473fce61d81d66d771749b"],["/categories/设计模式专题/index.html","21826728513946d98148e32c6ace4fe0"],["/categories/设计模式专题/page/2/index.html","c3de15de4ff773186698ef933c3114eb"],["/categories/读书笔记/index.html","1137de7fc513cee24bb645e2f5a6d24f"],["/categories/转载/index.html","5b39e10c9b9c0346c3388487b7fe708f"],["/fonts/iconfont.eot","3fdccc279c6fc8af79d5113865d6fd59"],["/fonts/iconfont.svg","3e969604074b7369f3738f1bfdb9472d"],["/fonts/iconfont.ttf","34e141c95d70fbc6429318aed1564d30"],["/fonts/iconfont.woff","d658c2b8af244e42eb9685090c1cf81c"],["/index.html","22bfd846f60be73ff5cd7ad0c8d5e331"],["/js/common/animation.js","4caf20a8d9b703a7415fc8c612e5aa64"],["/js/common/pack.js","aaa8d447cd5892b20fc2606824f0adb4"],["/js/common/utils.js","ebab2468b6979f1099edf8717643c65a"],["/js/layout/back-top.js","08fb4885c251c95a8598ea013f76dbb0"],["/js/layout/header.js","4aa0fb1ffcbdafe278f363c7bb2fb34c"],["/js/layout/loading.js","715537e05b27a70f7e2ed5555ab1a69d"],["/js/layout/post.js","efef5dbdea39ea806c6e0e4f52f5975f"],["/js/layout/sidebar.js","7d1eb636ce735839d375ad4742306e59"],["/js/libs/axios.min.js","848cc157033c57da268e171927a1ba92"],["/js/libs/lunr.min.js","dda8b6277f4495054278882952d89639"],["/js/page/post.js","89a4cbd103db83127c74fb02fd679e1a"],["/js/page/search.js","a038fefd0a0c2fe39eee4b9ec7f2077b"],["/live2dw/lib/L2Dwidget.0.min.js","32973883fcac0a9ae6cc79c0ea25fda2"],["/live2dw/lib/L2Dwidget.min.js","094cbace49a39548bed64abff5988b05"],["/page/2/index.html","b045372c3082d34c6b1b741176e8c704"],["/page/3/index.html","22f5bb381044eaa2fe3ae92e65a19218"],["/page/4/index.html","2c0220a3009c93142e4c3f9a8df9218b"],["/page/5/index.html","4f6314f135bb06b4181b760ed95c51d3"],["/page/6/index.html","296e97b1e8546195f2a7d8e1f53cebbe"],["/page/7/index.html","529861a28fbd97c6aa55627893422b3d"],["/page/8/index.html","6ab44a9f3e780773972e49e269f69b45"],["/posts/alibaba_code_style_exam.html","da629b302368e6bd1abc5b158fea4290"],["/posts/alibaba_frank_code_style.html","6ab34f2062465f5616667df36cb96f92"],["/posts/anime_recommed.html","50f1c019b8b46bc0267dd1ca4921d8b7"],["/posts/design-patterns-adapter.html","7355baf73afa352c8cfcee418ed2550c"],["/posts/design-patterns-builder.html","270d4328c7671b6836a52dba2017e23e"],["/posts/design-patterns-chain-of-responsibility.html","78cc0ca6bfd59b6c9c445403e6905e97"],["/posts/design-patterns-composite.html","1ec02301b3fc2c420a5cdabb57fbc7e9"],["/posts/design-patterns-decorator-model.html","60176efa532ecc6a70942e0f940fe305"],["/posts/design-patterns-event_design.html","075768c99579dc6a78cb7fe5cf39d634"],["/posts/design-patterns-flyweight.html","a3bb20fbdcffacb3083cb23a42a574d2"],["/posts/design-patterns-future-callback.html","646478b71ffba1b43ed16da2e6c58155"],["/posts/design-patterns-immutable.html","b4e9d0f8269f673ff4d08680a746e364"],["/posts/design-patterns-observer.html","d80a5e760af8797f44ab0cd57f1e9f5a"],["/posts/design-patterns-producer-consumer.html","4d5dff73d9ec65a009a3f53661137f91"],["/posts/design-patterns-proxy.html","cc5850ec8b594e6a32be711abe7395ff"],["/posts/design-patterns-strategy.html","073e789b2a0af2a1b34740947899a3eb"],["/posts/design-patterns-template-method.html","3afcbaf33a8f29cebe19623639ece644"],["/posts/design-patterns-thread-specific-storge.html","1a89bda24a3d05681986cd436fbd6813"],["/posts/design-patterns-visitor.html","5f69d8346991e47df262f3eb9ce41e05"],["/posts/developer_core_ability.html","91841df278cdc158e201763515122bf3"],["/posts/framework-double-extension.html","f7286bb204050591070c79f3f8335ba9"],["/posts/framework-double-loadbalance.html","7921929dda3f4e0289ffdc749b49132e"],["/posts/framework-double-replace.html","c8cc9d983b93bb4e8f25badece0e1b8c"],["/posts/framework-guava-bloomfilter.html","4a67c1ad6da4184c2f8dcf707beff777"],["/posts/framework-mockito.html","c7ae9535da1fd7aeee9072f75bb78475"],["/posts/framework-mybatis-mapper-proxy.html","480a7bf487388c675ccaf70fb5ea5eb6"],["/posts/framework-mybatis-result-set-handler.html","a07b480171ab3d028351ea64f02ba565"],["/posts/framework-mybatis-sql-analysis.html","8c1d95c6b24cf541da68030dde297fb9"],["/posts/framework-mybatis-sql-session.html","a5fe6ae23f798bb3ad536ffb640c631c"],["/posts/framework-mybatis-type-handler.html","65e36854e283195e9468b4b407ddf211"],["/posts/framework-netty-bytebuf.html","a50eae8acea8596ef6b5900fdab924b7"],["/posts/framework-netty-half-packet.html","4953427a5f4bd75e6fa82145430455bb"],["/posts/framework-netty-reactor-model.html","4fe380396d10875a1e37ccf142e919fc"],["/posts/framework-spring-apo-ioc.html","b62c78994582ff40cc970e16263aa12c"],["/posts/framework-spring-autoconfig.html","638ccee30e1d9faf5ed95526295dd5b1"],["/posts/framework-spring-cache.html","ddee2685ecfeb53b004ff8a69ccecc6b"],["/posts/framework-spring-jar-in-jar.html","612f6eeaabef1aae7828499425957c88"],["/posts/framework-spring-mvc-params.html","a0c0a5cde09776cc85e9611911d6c3a3"],["/posts/framework-spring-schedule.html","366b0d2c57fffa02cdd14e6b23f0d476"],["/posts/framework-springmvc-exception.html","a0f91a413365599a73b3320a7a93a716"],["/posts/framework-springmvc-framework.html","7880170e0079f4aac048ca5f11a7d4a1"],["/posts/framework-springmvc-request.html","01679b29647e79e29af853223a75d2e9"],["/posts/framework-springmvc-return.html","7edf29dc30d0db3436a73eec3af190da"],["/posts/hello-world.html","fc38b44fc506302bc43b159b2ab75312"],["/posts/idea_plugin_decompile.html","b293623fc75e7e60075105f9551a5b2c"],["/posts/java-string-pool.html","99e6c4eb009bc209cffd957f72662b88"],["/posts/java_abstract_interface.html","ed423d0892ec73d432ef47b52e069ee9"],["/posts/java_box_unbox.html","43220469f43cb6512ebc6647acb38898"],["/posts/java_cas.html","137185c9ee7f8c3bfc6c12ceaf4654b9"],["/posts/java_classloader.html","30f7db67fc0028f3ea66f2967891e587"],["/posts/java_close_file.html","4f1e3599abbd4664d006c2c171dd46f1"],["/posts/java_deadlock.html","ec4a34df726211604e933299b8b03b27"],["/posts/java_deque.html","68b71966b903f2f31ce799161f07a685"],["/posts/java_enum.html","350425ee6a69e0c3baa16e6cf95b67e5"],["/posts/java_longadder.html","5a6cff21e2fe473eccc3a7625315196d"],["/posts/java_metaspace.html","06c6927b8c8a39fabc69e14f91a6b008"],["/posts/java_readwritelock.html","9e28e06238d2729a253063a3d8559b6b"],["/posts/java_reference.html","4c182e14d69cec9ca2d03c4a74752d42"],["/posts/java_serializable.html","ef219f11b203391665d1c9f1bea66fb6"],["/posts/java_stream1.html","00098e9e5b7685bc0804218f53589e9a"],["/posts/java_stream2.html","de7cfe826441a4d123ead7a3523bc3c7"],["/posts/java_stream3.html","a81fa997dacc4fce69f43f8dff81b80a"],["/posts/java_stringbuilder.html","669b1d0d3a583219c8ae07c574cbf765"],["/posts/java_threadlocal.html","c08efeabb271a47c6e71923e76df58f1"],["/posts/java_threadpool_completablefuture.html","a9b4280fe960c267ea5e060a5d41e206"],["/posts/job_interview_2017.html","6a057146204c6bd60f939870111d8710"],["/posts/job_interview_2018.html","2cc420558232aaaacabc1ec1e6d69eee"],["/posts/linux-expect_script.html","0ad5850274fdc94850f85985c4ee0895"],["/posts/linux_tcp_close_wait.html","b1fe22d14d93b8093acf9c0bf1039090"],["/posts/mysql-distributed-lock.html","45b14099ff254182c3f11b3dd3cc28d4"],["/posts/mysql-index-guide.html","eee28d21266d7493d04acfea7b0a053f"],["/posts/mysql-lock-handle.html","68bb45a0dbafa5e5e544f5f2dc6fbda9"],["/posts/osx_app_switcher.html","9f3ad9c20b252c162c037da86399d4da"],["/posts/osx_install.html","e51bd12ef76e7d4b93eee45ef1895662"],["/posts/readnote-http.html","c6853b399e9b1ab7b63dc7e281da2cac"],["/posts/readnote-maven_in_action.html","99cd0fdb5346a488f418964a51032010"],["/posts/readnote-mysql-45-summary.html","6f27194066403f8bc356de8c9163b720"],["/posts/readnote-pro-git.html","701b8afc4c88bcb27084687cf51e41b2"],["/posts/readnote-regex.html","f9eeca014daa24e9f6d0dbb783c3266e"],["/posts/storage-ssd.html","e426ae2ae14d95396554fe8ca0b33913"],["/posts/tools-alfred-cmd-search.html","aebe08fa16449d6c8c79d1278dd3c9e7"],["/posts/tools-cors-anywhere.html","370d6e61dd3a6cb7305be54388e3ba55"],["/posts/tools-dalgen.html","0f526f7122528d005569ffcc89e017bb"],["/posts/tools-excel.html","d7b67efce1e776a8083fface94787530"],["/posts/tools-hosts.html","1ed31ec95b2076e53728f003c3bbf0c8"],["/posts/tools-time-convert.html","63992120283c9948f37231bf4eb01df1"],["/posts/tools-v2ray-cloudflare.html","520a17d6f9e05a6fbc2f5e335c9ddbdd"],["/posts/work-design-binary.html","74bf374850f84495359e6b6eb9cda8c5"],["/posts/work-design-command-model-in-action.html","66f5ebdacebbfb753fcd36c52757d2e2"],["/posts/work-design-common-selected.html","63dc9e4001d038331b8d03de8bfd320f"],["/posts/work-design-java8-timezone.html","aff7f23c12fdb00f51708529556a6315"],["/posts/work-design-jwt.html","cef0baf1b9165a951252499c9fb1e21d"],["/posts/work-design-microkernel-biz.html","444b3159db70f1697aa6dcd7fde689e6"],["/posts/work-design-velocity-sql-inject.html","b51cbd27a762f9b1202710b456ccc11a"],["/posts/work-how_config_log.html","1d130fbfe6822313b3da34b7a0ef6ad4"],["/posts/work_how_design_user_login.html","4d9d774d8496f05da39186e0b594875b"],["/scss/base/index.css","6cdc21c715c8f464f3f640d5fab16363"],["/scss/views/page/about.css","65dc429be5de1d73a1575d58365b94e9"],["/scss/views/page/archive.css","d70685972f811fe10b2dcbad21e825d7"],["/scss/views/page/category.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/error.css","a28c9232c644781481405306b9762ad1"],["/scss/views/page/index.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/post.css","dd2fcf4bd6fb18230128c376d924b34c"],["/scss/views/page/search.css","0376462c0ec6b41476a1df1358bb3de0"],["/scss/views/page/tag.css","859fbbf6bae99a4926c013a87a150947"],["/search/index.html","c92a4a99dcb3c4288d954211b87ac1f2"],["/tags/Alfred/index.html","113aff68334291536d81a265829f3448"],["/tags/Dubbo/index.html","0ec98e6e7b264edb3c719860c5887f5f"],["/tags/Guava/index.html","d941b739d1fcde37659d44b2686b9e1f"],["/tags/IntelliJ/index.html","43cf58b4445d1a6b99184a297a140c11"],["/tags/JUC/index.html","baf36f90b0554ad013cece9a238e3d76"],["/tags/JWT/index.html","6ce6777f1ebe79d5329697c85a9b0b2b"],["/tags/Java/index.html","56ec0fd54d0b4687159d1addac60a689"],["/tags/Java/page/2/index.html","0c52e88e3e0c1fa47074db796a8459bd"],["/tags/Mockito/index.html","ccf197d5728a32a2737596eae33f8a41"],["/tags/MySQL/index.html","e676e712e9e1f37a0102ab24e84c5045"],["/tags/Mybatis/index.html","d9bec271e16f98b97050a997c51f0cb2"],["/tags/Netty/index.html","2c190610fe189e09800e1bd2c4884f51"],["/tags/OSX/index.html","d1315ffb8d756486ceb3c5896e3c064b"],["/tags/Spring/index.html","a590787b406a322d9ba648c5a33048a9"],["/tags/index.html","f135ff2db82179c0eb5469d4eec8ff47"],["/tags/动漫/index.html","1274998ca5a678db7d0339f916d3aec4"],["/tags/实战/index.html","628fe29f4d566aba8417144ee5ef2594"],["/tags/工作/index.html","919a5c091baa68b7f8f0ae9400af80ca"],["/tags/设计模式/index.html","a405ce684d32fde6d72f99be40b44976"],["/tags/设计模式/page/2/index.html","9c7205aad8569ff9c2e30eb19756bab2"],["/tags/读书笔记/index.html","deac834a087fb980338b5b68f8fcd9ee"],["/tags/转载/index.html","4a50cf5d1b5a5772ca8f4b6a2f816657"],["/tags/轮子/index.html","d8e94fed280aa0020885a6daffdef838"]];
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

toolbox.router.get("/^https:\\/\\/res\\.mrdear\\.cn", toolbox.networkOnly, {"origin":"res.mrdear.cn"});
toolbox.router.get("/^https:\\/\\/mrdear.cn\\/$/", toolbox.networkOnly, {"origin":"mrdear.cn"});
toolbox.router.get("/^https:\\/\\/**", toolbox.cacheFirst, {"origin":"mrdear.cn"});




