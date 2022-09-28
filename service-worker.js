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

var precacheConfig = [["/about/index.html","e458e194c33531529456021b5b6ab23b"],["/archives/2017/01/index.html","7a73ccdfd4d916db4329b1db68de5553"],["/archives/2017/03/index.html","ca45b371831f34fd9b14de84bc2edc67"],["/archives/2017/05/index.html","e0bdd065f3f8d5f0c55d12f4a17a730f"],["/archives/2017/07/index.html","8b688c235eff2844e608100cacee029d"],["/archives/2017/08/index.html","fd44d96e1b589e429507ae5d0b328e9c"],["/archives/2017/09/index.html","310b6cd5503c586fa1de418ccbf8af6d"],["/archives/2017/10/index.html","34a021d56794b0efe35ff8fa840a17c4"],["/archives/2017/11/index.html","c06ba9ffee607fbbf587c2c8503f0376"],["/archives/2017/12/index.html","e29fbcfc4b4d91762e977a720e39c485"],["/archives/2017/index.html","bd88dfa29958cc6ec35b31c652d81ab5"],["/archives/2017/page/2/index.html","8837f85aeccc4c364f79fc9204d45025"],["/archives/2018/01/index.html","92d6984d4f90107149d73779b60b8903"],["/archives/2018/02/index.html","349d8d3de2e7342c553cd8492a2430f4"],["/archives/2018/03/index.html","3bf4fdb7cb5b2cd0e6a2f5ebfc4ac8fe"],["/archives/2018/04/index.html","8742a7bf447cca07e260719da81e9326"],["/archives/2018/05/index.html","be6b844a6e26ef2626d0ad1553244608"],["/archives/2018/06/index.html","461c0e7b925f3257b1a24918bdc076eb"],["/archives/2018/07/index.html","d402aff8fb7c6d879669b728d68d1110"],["/archives/2018/08/index.html","e3a681893762242acdde87bc39ecfade"],["/archives/2018/09/index.html","4ccf442cf6fedbf5253e440d5e557da7"],["/archives/2018/10/index.html","f4477942ac8f201f933217a2c4c28b4a"],["/archives/2018/11/index.html","e31a163f59312c703207c515ee6ddf57"],["/archives/2018/index.html","c9f416344c20135b0f0cfef5a0e6e718"],["/archives/2018/page/2/index.html","3953c5ff547b7610dddef496ad47c13e"],["/archives/2018/page/3/index.html","11d3c4452a3f524acd088bc6fb05aa85"],["/archives/2018/page/4/index.html","8f4095282902eaae4171f3eb0cd10046"],["/archives/2018/page/5/index.html","cec56fa0169b1b3266a9ebd1458368b8"],["/archives/2019/01/index.html","e4468be69e2f0015165ecd625c160b0d"],["/archives/2019/02/index.html","116c49bd1b02d5ab8a8055683bc02606"],["/archives/2019/03/index.html","5bf096b957b87e21b08888e94615fbd6"],["/archives/2019/04/index.html","9eac8de5247b63d6807fa3dff1293a36"],["/archives/2019/08/index.html","cd814dda134f8347d57f1adac4cbfe13"],["/archives/2019/09/index.html","10d603938c428cdc37224ec6ceb640e7"],["/archives/2019/10/index.html","88563240baaf114eda17f47119fc163c"],["/archives/2019/12/index.html","43d379b6d49416d95cf8bad775cc5fef"],["/archives/2019/index.html","778a01332a05dba1d6975117dbb81297"],["/archives/2019/page/2/index.html","5f8ed79c3c349c6a683100d544593b4b"],["/archives/2020/01/index.html","12b58dcdda5e85e3aab63eb6d9e00aeb"],["/archives/2020/02/index.html","ee44b99c473020245a5274a80580d878"],["/archives/2020/03/index.html","ebd90e6997c60a5f1f55a3c0f77658b4"],["/archives/2020/05/index.html","ab995ac6e5a3dab4674a6853cf69589b"],["/archives/2020/06/index.html","f6780cbce42ceacfbefc3a06012e8f0b"],["/archives/2020/07/index.html","4fa58fc2cc249980969b2908a7fd9034"],["/archives/2020/08/index.html","e41e92b9517f2a8e4271c2f7abdf80a2"],["/archives/2020/10/index.html","2cab71ee9a6eef9a3439fe43dc3c3613"],["/archives/2020/11/index.html","d13561c6f528ab6eed3a867247295a4d"],["/archives/2020/12/index.html","8c092b896d5be1985bbc11c7a7d926bf"],["/archives/2020/index.html","b8d63284230279e709ccf0c162c7c433"],["/archives/2020/page/2/index.html","3f62921c1f859f9c72b5aa28608274c6"],["/archives/2021/02/index.html","9d62f2c92e10a225da5b7a789fb4beb5"],["/archives/2021/05/index.html","77b77989648b9d564bc35108ec89b17a"],["/archives/2021/index.html","74e321f46cdc22e11752d33181236343"],["/archives/2022/02/index.html","5347d2301da4f1bc9cc700817cd9eccf"],["/archives/2022/07/index.html","6986bead5ea204f4b7d8a8bc08faf7b7"],["/archives/2022/index.html","385cfdf44323ae30e87010279c32bba2"],["/archives/index.html","4aeed8485de2b42601d56170d7aac459"],["/archives/page/2/index.html","183eeec1224bfdbf03aa54b339501561"],["/archives/page/3/index.html","28eefe56f193043581b1dfc34ee6f735"],["/archives/page/4/index.html","f75bcb86e82dc8f5c0860c0005694cd6"],["/archives/page/5/index.html","ad87ff3e3878f292f458eac703114769"],["/archives/page/6/index.html","95008fc022e9fd18c7529a4c0c951325"],["/archives/page/7/index.html","b30f271ad375ef130913f992bed58adb"],["/archives/page/8/index.html","1b370e279e7c7e5c6c7d821300988ad1"],["/archives/page/9/index.html","a031ac3e0a9ff54b773888800a8e1a13"],["/categories/Spring系列专题/index.html","cd363a376ae36149a7c7a8fa149bb6d7"],["/categories/index.html","9bc0afd7f2cf1acd9c71b5ef86d8c20d"],["/categories/大数据/index.html","b6d91386296df8682517aa8ba045fd14"],["/categories/夯实Java基础/index.html","4f85d795ec9e6e7209268f3d941ada36"],["/categories/夯实Java基础/page/2/index.html","cdc2b299134856aea16b555d53c4e2e2"],["/categories/实战总结/index.html","2f9422b45558b7156fd1e81bd4bafc65"],["/categories/工具/index.html","eb35a92d08b20df3350a6ffea825a31c"],["/categories/操作系统/index.html","eff05ccdc172d52606e53e42c8e69fae"],["/categories/杂七杂八/index.html","fd40c70b4b1eabad0465509e079974ee"],["/categories/框架与中间件/index.html","04b73fb2f30ad2a3cfc6bdec4a60c675"],["/categories/框架与中间件/page/2/index.html","8210535fe848812d463efee880f78e5e"],["/categories/设计模式专题/index.html","d4f1269967a2d105020d6a8454f2c95f"],["/categories/设计模式专题/page/2/index.html","1c966d6fcc4b55286dde1821e8c9d7c2"],["/categories/读书笔记/index.html","3e16c6b92635f236502be188f3b34a67"],["/categories/转载/index.html","44aff82dbd7468c368fa865949c711ed"],["/fonts/iconfont.eot","3fdccc279c6fc8af79d5113865d6fd59"],["/fonts/iconfont.svg","3e969604074b7369f3738f1bfdb9472d"],["/fonts/iconfont.ttf","34e141c95d70fbc6429318aed1564d30"],["/fonts/iconfont.woff","d658c2b8af244e42eb9685090c1cf81c"],["/index.html","703cb92657c417f87d96d1a62e401f0e"],["/js/common.js","474fd1de4b8850fae5bd1f392a56e778"],["/js/common/animation.js","6deb756f3e55bf2a44ac635264a3bfde"],["/js/common/pack.js","8f2fc3e4e123f9b4e13a0808d91b63cd"],["/js/common/utils.js","992ad57e59305868c11373456e7c95c2"],["/js/gitalk.css","8ba64f67ac63e628f621808d0bef9fea"],["/js/gitalk.min.js","c021128f9877e5b5b2bcb45bec63e814"],["/js/layout/back-top.js","5b5bf97d3db85ee9894157587424aaed"],["/js/layout/header.js","b1a6a9fe66eda5afbc03b944379f1761"],["/js/layout/loading.js","a67a6148babc8ea5f899067bc79e4645"],["/js/layout/post.js","06e19e83dca0fa5d52d507f04b8ad2ca"],["/js/layout/sidebar.js","b52291ca57dc284e475009c6d26b4358"],["/js/libs/axios.min.js","e9e48cd857bfc7874945ac764c6e6495"],["/js/libs/lunr.min.js","15ef268d2498a92db189f3e2e34c8fd3"],["/js/md5.min.js","dcd3361e674f4400b5f85a3e6e78d304"],["/js/page/post.js","5d111a40c37de09379c736b1d7bbd8de"],["/js/page/search.js","6026bab9ee7800249be409a0414d6610"],["/js/search.js","308eb816e87c00407fd44676f18cb812"],["/live2dw/lib/L2Dwidget.0.min.js","32973883fcac0a9ae6cc79c0ea25fda2"],["/live2dw/lib/L2Dwidget.min.js","094cbace49a39548bed64abff5988b05"],["/page/2/index.html","834d75cb260dbf7c1eb7bb0a0bede24c"],["/page/3/index.html","7b61e856a46f027b4f1eb400bd946a16"],["/page/4/index.html","ba72ed46c64dbeea66666b89e7f789ef"],["/page/5/index.html","579a68b0dd38507384978310c5dc59b3"],["/page/6/index.html","fc764bc3df291d33dd643c7cc03baab0"],["/page/7/index.html","5a99617901922363877bdee6e9503cbd"],["/page/8/index.html","7d5acf8b1a4ec98f0cab6b3fb1056024"],["/page/9/index.html","8830b040ba45476fd06ccff483250a63"],["/posts/alibaba_code_style_exam.html","edfac1ee241f775838595707e4a33b02"],["/posts/alibaba_frank_code_style.html","2a83671509e96140518027884c0a4581"],["/posts/animal_crossing_recommed.html","65e1dfba828fbfd3d881633c4dd7426d"],["/posts/anime_recommed.html","56dc216bf4379dda3de61c1eee578f9c"],["/posts/design-patterns-adapter.html","f051b942436eef2582040f881a9211c9"],["/posts/design-patterns-builder.html","6298b6ca6b414f8e754810f9c5da686f"],["/posts/design-patterns-chain-of-responsibility.html","1b301946ee6922d51dfe19dd1bdee7e6"],["/posts/design-patterns-composite.html","950b1cbce3ffeafadacb5e91434cd112"],["/posts/design-patterns-decorator-model.html","b9cc848a349f0d63270bc96eb9f78339"],["/posts/design-patterns-event_design.html","a184aac16c62cfe99c7c87577fd5bb01"],["/posts/design-patterns-flyweight.html","a5bad9231878c648d69fc8e9408e1e61"],["/posts/design-patterns-future-callback.html","df20b2d8c9690eb39ddceaac3de1c2f2"],["/posts/design-patterns-immutable.html","41c1e8a530dc1f531ec46f551328fe0d"],["/posts/design-patterns-observer.html","a23cafd13eb65918dc4f8ff279a23fe3"],["/posts/design-patterns-producer-consumer.html","7b54bd6f3865d642e4726da74bc88d77"],["/posts/design-patterns-proxy.html","402788baf38824cfa84f6109a16f53ee"],["/posts/design-patterns-strategy.html","18e36357e02ef0a366360928ae24a296"],["/posts/design-patterns-template-method.html","5335c3a015370e02a5d001c42b5fb222"],["/posts/design-patterns-thread-specific-storge.html","128c477dbb5f59f29275dbd873cf11b7"],["/posts/design-patterns-visitor.html","52986b33f6423aae7788532223ddcea8"],["/posts/developer_core_ability.html","9008a7166d6c3c713bdcd4d24dfcab6a"],["/posts/framework-apache-common-cli.html","5a156207e14ddfd3d14ba52c20ba07c2"],["/posts/framework-double-extension.html","45dd3bf91f3ccf01aa547011a484a2db"],["/posts/framework-double-loadbalance.html","37e5098677b50ddd54e39ad82a8957ee"],["/posts/framework-double-replace.html","a6839ae0f3b0fb4f5dc86f623a477798"],["/posts/framework-guava-bloomfilter.html","f13906c93dbc13530b3fc327f888fefa"],["/posts/framework-hadoop-map-reduce.html","cccf84b415ea56320f09278efd5b4c83"],["/posts/framework-hive-study1.html","b8bdcb66e5f4e9290276e8221f791f3b"],["/posts/framework-hive-study2.html","a55e635636597eb5e1eaca6d6c7fc777"],["/posts/framework-mockito.html","5c0707991a1c9bd71b54cc596ae240aa"],["/posts/framework-mybatis-mapper-proxy.html","fbbbc51d3415970067f5b4c1734a1e3e"],["/posts/framework-mybatis-result-set-handler.html","032750bdaca771e9f82aebaf5e2d37ce"],["/posts/framework-mybatis-sql-analysis.html","f8c072560873910fa9a0e34ac0c2d56a"],["/posts/framework-mybatis-sql-session.html","745eac3927c030aafceac5fa11d94877"],["/posts/framework-mybatis-type-handler.html","d5294c10171a00f93581deb93539d591"],["/posts/framework-netty-bytebuf.html","c527d53bb5d8dc2c7e6c856c4df42992"],["/posts/framework-netty-half-packet.html","d195373fa126e2cd528539516f7a663a"],["/posts/framework-netty-reactor-model.html","f1bfcabcf6016a163280e7cf5e80014a"],["/posts/framework-spring-apo-ioc.html","73733bd73244125b6a84b1bad13085f9"],["/posts/framework-spring-autoconfig.html","0483dada11f45668e70e257e8e6f9adf"],["/posts/framework-spring-cache.html","453b711e1684ce7ab2f5726feb3b82bf"],["/posts/framework-spring-jar-in-jar.html","73e7e9946410e3e26591343d912bceaa"],["/posts/framework-spring-mvc-params.html","c20b8c9af726cbc9a5e4e7c865ddd113"],["/posts/framework-spring-schedule.html","9f2c2add2e49533e6880481b89a72019"],["/posts/framework-springmvc-exception.html","0c627be596ccfda327d225db62ebe695"],["/posts/framework-springmvc-framework.html","012e3eac8dadae51956bb23fb796e7ca"],["/posts/framework-springmvc-request.html","bc34fa54de7377eb38b1c1b4f65d8cd1"],["/posts/framework-springmvc-return.html","c63be162a1a5103956d152f014890ecb"],["/posts/hello-world.html","8df73d0e26cfa4f0a740e714097a444d"],["/posts/idea_plugin_decompile.html","4b3c3fe3676fa49b778fc626e99234ee"],["/posts/java-string-pool.html","2864706f57dce96e7d83f3b277271eda"],["/posts/java_abstract_interface.html","5347974a7a1996667a34c805973961d5"],["/posts/java_box_unbox.html","f5700b6d8db308235b78cc440fd52c4a"],["/posts/java_cas.html","a7703e51027618e8f7dfd76b9b6e0c82"],["/posts/java_classloader.html","75dd208d66478a61c7bdf111c3653d53"],["/posts/java_close_file.html","09eb766ef51169106b7369bf3216d358"],["/posts/java_deadlock.html","eaf9c7936ec735b1cfb10993da2f1f86"],["/posts/java_deque.html","e9eabf0da13745cbc69748ecdf10b37d"],["/posts/java_enum.html","dc5a3afb68cba1a1c4b06925b907c768"],["/posts/java_longadder.html","43cbe79e23578017ec1376ff925f9eee"],["/posts/java_metaspace.html","41959e1ebfb206af5c2cc84317c8011a"],["/posts/java_readwritelock.html","b93f807d91e3cb159203ce8d7c4615ad"],["/posts/java_reference.html","c6716735db16d39d777d18dbed917106"],["/posts/java_serializable.html","4f1877c4810ebc0ba8b81b6d5ad2742a"],["/posts/java_stream1.html","7c524256e6c997375232e5c2c8cf6228"],["/posts/java_stream2.html","eff8bed46c7f9d99195014f2d1c401c6"],["/posts/java_stream3.html","6bf130d5382cfa44382697bfbd43a4e0"],["/posts/java_stringbuilder.html","562b44cad59874b98fb87010ef9d13c6"],["/posts/java_threadlocal.html","22a5131098460bcc557c7c0c77f79dd5"],["/posts/java_threadpool_completablefuture.html","25f30d5ae9328a27b34644f60ff94682"],["/posts/job_interview_2017.html","06b3697b7e64d5dfab58919efcc6a71e"],["/posts/job_interview_2018.html","5dbe07bdc6b64e143760c1363c70eca1"],["/posts/linux-expect_script.html","f36fd6861fa18b4595b4c50f57c4f748"],["/posts/linux_tcp_close_wait.html","0696a7c181e37f269bf30290c163286c"],["/posts/mysql-distributed-lock.html","f9b35ca0e8626428661ebb3d02cb06de"],["/posts/mysql-index-guide.html","222a83f0e2509ca2918931d1a173fd98"],["/posts/mysql-lock-handle.html","2938fb3cf2bb8a70eeb479628f56a44c"],["/posts/osx_app_switcher.html","42470ef423ad7f2388294e8350f839db"],["/posts/osx_install.html","aaab6eae063f9c13e3cb32fed8788bc7"],["/posts/readnote-http.html","d4fccc7e956818f8ff38226e1673797a"],["/posts/readnote-maven_in_action.html","a9b3942f7d5980c39aa5d79516400ec1"],["/posts/readnote-mysql-45-summary.html","d2e0b2d56df1d752a4f6978fe2356c69"],["/posts/readnote-pro-git.html","cb2f8f4bdfa29a3d0e8c160ef1230ef2"],["/posts/readnote-regex.html","1767070f962e89a9383404694b838ab0"],["/posts/storage-ssd.html","525a2fe9990f2ff8c2882ba885fed9bf"],["/posts/tools-alfred-cmd-search.html","318c49d10983a80251e2dbddfb614421"],["/posts/tools-cors-anywhere.html","7debc01107457d8b232a23377fb82ddd"],["/posts/tools-dalgen.html","49d14f27d915ac5514e7b078f3428b40"],["/posts/tools-excel.html","b0e375c372bbe6bc5250dbe237ba7774"],["/posts/tools-frp.html","c4c9810feb6d3b9f6c50411ddb31b93c"],["/posts/tools-hosts.html","42f60c474c573e429f0d12ad704bf607"],["/posts/tools-time-convert.html","fb342ff184b88cd0a987a50368e9b500"],["/posts/tools-v2ray-cloudflare.html","f4d7e3cd2d958105c13c1f8740adaab1"],["/posts/work-design-algorithm-recursive.html","c5027d03e5b93f6e944fe72ddc751543"],["/posts/work-design-binary.html","0971b9d459e7b1d19646f4249c45c6fd"],["/posts/work-design-command-model-in-action.html","38ccb109be918d0064186b2a025f9b0a"],["/posts/work-design-common-selected.html","79a064563a986a459839759477ee145d"],["/posts/work-design-java8-timezone.html","b4a2bfe6365563d12714982d436f95de"],["/posts/work-design-jwt.html","f046e536f679584cf9d4f80480ca8021"],["/posts/work-design-microkernel-biz.html","0f43a40378e4dae3aedcc8df38e626e6"],["/posts/work-design-velocity-sql-inject.html","f52f8cedcbefa12a079149748fa474a3"],["/posts/work-how_config_log.html","eed46bb17e1123496ca6cca6aef52937"],["/posts/work_how_design_user_login.html","a3dccabe627b0e33b2388c26c0022d4d"],["/scss/base/index.css","dae7786213eb49e050a0e3b862059cad"],["/scss/views/page/about.css","eec45373729095a8c4ac296467beda26"],["/scss/views/page/archive.css","9aa41a47e000c097cd2814f2350bb574"],["/scss/views/page/category.css","d41e0426cf9e171fe46f180280cb4f45"],["/scss/views/page/error.css","8cec41ec6b5f26ef84057e3233b36d86"],["/scss/views/page/index.css","d41e0426cf9e171fe46f180280cb4f45"],["/scss/views/page/post.css","b96772dfbb6dabe98ee3d5e55526da4c"],["/scss/views/page/search.css","f20af30c033922bcd8318ce0ee1450f1"],["/scss/views/page/tag.css","d41e0426cf9e171fe46f180280cb4f45"],["/search/index.html","7e7d7c194b8562a5d2664c33ce67465c"],["/tags/Alfred/index.html","ed767bef75099541e2c2056659084f3f"],["/tags/Apache/index.html","2db1420f21db7353a56e8fff02738f3f"],["/tags/Dubbo/index.html","0e255cfb9a4fffa83a480968c729eeb6"],["/tags/Guava/index.html","8db16d593084bce98950244b438695cc"],["/tags/IntelliJ/index.html","957c1df7c1afe180ff13ac18e09e4288"],["/tags/JUC/index.html","8ca35af0e64d23fe8c7dd29db02d17b6"],["/tags/JWT/index.html","e77117e4abfd4e7f9409c1611e8b461d"],["/tags/Java/index.html","742f5c8e7a6c77a38d1b3ba73405cb05"],["/tags/Java/page/2/index.html","f7e23f0aec4136710151f004bf53fd46"],["/tags/Mockito/index.html","4893ae38868655b4f76844b39bd39238"],["/tags/MySQL/index.html","bf3432ec7137ec2f53d2aacd56e5e770"],["/tags/Mybatis/index.html","86bba194517cf596eaa4b0d6d4bbb484"],["/tags/Netty/index.html","02fda07a1006166ef2fa4b991ec5f5b1"],["/tags/OSX/index.html","e19f833ba4863218e05a20d13969d80c"],["/tags/Spring/index.html","5ba4487c9eba795541b47f673f4d0944"],["/tags/index.html","1600ccc0263bc7e2ffd79ebd57c35433"],["/tags/动漫/index.html","baddf89b8333b850775a01e3be8e3a1b"],["/tags/大数据/index.html","2ad830a02b5925df40c037850dc17552"],["/tags/实战/index.html","6827c023bee848b770830e300ac594af"],["/tags/工作/index.html","dc106a3219941e552ca278ba30a9ab3f"],["/tags/游戏/index.html","f20651baf8d2ade6df4aa66256105f28"],["/tags/算法/index.html","63e1f5b1d6a941453fe060ebd1f7543e"],["/tags/设计模式/index.html","ea45bbd8e66ad624936e82be49d654e2"],["/tags/设计模式/page/2/index.html","567040d5cceec3ccfcce6fb1197bba5f"],["/tags/读书笔记/index.html","c317d6f9fe1fe46906f0eb0aa0952c6d"],["/tags/转载/index.html","9b3e3625bacb1e474f9d1b46f01162c7"],["/tags/轮子/index.html","8a1b50a5fd18b52d92f68a86fd41feb0"],["/works/index.html","1b07689fa8576a59904035bcd1f011b9"]];
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




