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

var precacheConfig = [["/about/index.html","2435390d00becc63ab18b0091a7f31a1"],["/archives/2017/01/index.html","9d3764d4635f9b7bec908d1a09f54721"],["/archives/2017/03/index.html","796340df766b32c96b58c16553b09a76"],["/archives/2017/05/index.html","0a07e090177db78cc0285dc7d61ce392"],["/archives/2017/07/index.html","4b7cf1861d18ca9656eb8e99cda30ceb"],["/archives/2017/08/index.html","496cef8657b5a7d371a797c3a1861877"],["/archives/2017/09/index.html","b3c22a594df7af1ad71886126826bfa8"],["/archives/2017/10/index.html","e0689b32986ffbf76053413deb8274bf"],["/archives/2017/11/index.html","4fd53a8004dc50c4409a6f4f546578fc"],["/archives/2017/12/index.html","9d492c9297a0b2a87433b1542910a73f"],["/archives/2017/index.html","ee0041cd49207deda22d5b41b7267aad"],["/archives/2017/page/2/index.html","ea1774fdcdd831d4b4fbf4057865b6a7"],["/archives/2018/01/index.html","bf5695e9362f6185156950ddabce2d14"],["/archives/2018/02/index.html","cfb7c7433b9239d230fe05e6e5eb97d2"],["/archives/2018/03/index.html","d257a1cf4270ddb894827ba3c2ab3aee"],["/archives/2018/04/index.html","809bfb970123aaf80349c9a13b0612f0"],["/archives/2018/05/index.html","8a618b8e199322f28bf9951ed169ab4b"],["/archives/2018/06/index.html","5921d4730cf6d5143adb769930f5a92b"],["/archives/2018/07/index.html","56a978861908e27098db17eb501f593d"],["/archives/2018/08/index.html","e4dc972d5bff2434fdb178445fea8f5a"],["/archives/2018/09/index.html","0f5cb3c452968ded634f69768452783d"],["/archives/2018/10/index.html","cb0f95d3c65b94dedb85fdd2785206e6"],["/archives/2018/11/index.html","ced19b9cabbb50eace6fe351726e884d"],["/archives/2018/index.html","aabb7283a7aa3dce046d44366e022555"],["/archives/2018/page/2/index.html","6c698fe7ad3312b0b388ddbfa4bae22e"],["/archives/2018/page/3/index.html","f374897e39c6c0f3b7d1df361d30becd"],["/archives/2018/page/4/index.html","e3d37c40370f29128eb77830c9ec2378"],["/archives/2019/01/index.html","c2a0c019790fe9a9f2eb8e82e639bc1c"],["/archives/2019/02/index.html","3c884c7c59d3d2a2cf0b3bd1467045c0"],["/archives/2019/03/index.html","c2cfb71fad5164b0f659e95e9e347308"],["/archives/2019/04/index.html","76a8519ace9674ca3ba492550700350e"],["/archives/2019/09/index.html","cd1a51a753ac1b2f2aa5b10cc6e51a0b"],["/archives/2019/10/index.html","831e91a04843d477887f135a970d6d47"],["/archives/2019/12/index.html","0055bae6ae63296b9baa4babe299fc3b"],["/archives/2019/index.html","1fd6ab42ea9dcf26c953526194113863"],["/archives/2019/page/2/index.html","5fe2fe2d69ebc79458c402f73d8129b4"],["/archives/2020/01/index.html","ea4de048da393d25392eb33720e9ead3"],["/archives/2020/02/index.html","946c5ff7602e59edfb7e413ddc00043e"],["/archives/2020/03/index.html","ebea3b5f2816e083aaba307b0e9be246"],["/archives/2020/05/index.html","530afad5096d869b92005a7c8be6e422"],["/archives/2020/06/index.html","c1f9e5969968dc2e6fde76f649f3e311"],["/archives/2020/07/index.html","51cfe046cfcd6c0388f1386b2f59f43e"],["/archives/2020/08/index.html","7634a092de542e9bde15fc69016b4615"],["/archives/2020/10/index.html","bc208a2dede043fad93ea6f358d36e62"],["/archives/2020/11/index.html","ec066980440e4ee4c686e86ce04906cf"],["/archives/2020/12/index.html","ea3b7638818312580e7b502febc4b0e8"],["/archives/2020/index.html","ddef7724331f9ad950ed35b60a6a3d7f"],["/archives/2020/page/2/index.html","bdcf0fc2205e3ed21608b96adb3f0c46"],["/archives/2021/02/index.html","693755a903389af486c6952feab490a9"],["/archives/2021/05/index.html","4ba3ce767b0fe3fdaa5e52703e0c20c1"],["/archives/2021/index.html","90960685de5313c61c8a665acee5d62a"],["/archives/2022/02/index.html","c95f3e8c83772066e9765117573ccaf5"],["/archives/2022/07/index.html","72cea2cb81053841e1abba9a70faa3f6"],["/archives/2022/10/index.html","9df49c52b1708e0e645608bff71cb18b"],["/archives/2022/index.html","0aab973e81ce0fb89fe3dae2e550eb41"],["/archives/index.html","d901c533861a7c88696901deaa1c0820"],["/archives/page/2/index.html","33f84fe2c2909df7ba69ca9b58c3611f"],["/archives/page/3/index.html","b8088b24ea1f6249521a2f226fe01e82"],["/archives/page/4/index.html","c082bff4b5c524e6f2f7fb6b2dabfbf5"],["/archives/page/5/index.html","723eca2c13ad57cc6828c7f04144e1d2"],["/archives/page/6/index.html","065f48a276e6d8f1c0f402e075cb28d6"],["/archives/page/7/index.html","9aca06b0a387318bf1604cd2aba954e9"],["/archives/page/8/index.html","a2a5236584fc2168e53e182a6c4d1060"],["/archives/page/9/index.html","24591d71fa04d8bac2e0b4c00b79229b"],["/categories/Spring系列专题/index.html","9ecc4148d81177e96afb59e2f10b9dfe"],["/categories/index.html","7d15c96676cdca893a31965addb25643"],["/categories/夯实Java基础/index.html","5236fef3b1be3ae0608927d5468ee0d9"],["/categories/夯实Java基础/page/2/index.html","a7bae9b92e00fe85ae3253feda1f78c2"],["/categories/实战总结/index.html","4e231c157e2d4ab09b322982292f493a"],["/categories/工具/index.html","d4e27fccbcd840808f611ec27196b449"],["/categories/操作系统/index.html","1753a841a2ca9b67ccdcc299346520d7"],["/categories/杂七杂八/index.html","3e5382987963cf42840e7f596f60913e"],["/categories/框架与中间件/index.html","68f5048fa7600695d68cd62f37437fe3"],["/categories/框架与中间件/page/2/index.html","9784a272fc965c1aa12702845c457d35"],["/categories/设计模式专题/index.html","9fdee4f436db6d87285936224abbc646"],["/categories/设计模式专题/page/2/index.html","3a819a628c51aa5276bc31d5ed02d825"],["/categories/读书笔记/index.html","2647d0b69ad4b8d9458bfdf6c7e5b837"],["/categories/转载/index.html","7c36739c838c0a5b1d96d035d64c96b2"],["/fonts/iconfont.eot","3fdccc279c6fc8af79d5113865d6fd59"],["/fonts/iconfont.svg","3e969604074b7369f3738f1bfdb9472d"],["/fonts/iconfont.ttf","34e141c95d70fbc6429318aed1564d30"],["/fonts/iconfont.woff","d658c2b8af244e42eb9685090c1cf81c"],["/index.html","ebefbe3fa900f20a6a86bdfcbeaea107"],["/js/common/animation.js","4caf20a8d9b703a7415fc8c612e5aa64"],["/js/common/pack.js","aaa8d447cd5892b20fc2606824f0adb4"],["/js/common/utils.js","ebab2468b6979f1099edf8717643c65a"],["/js/layout/back-top.js","08fb4885c251c95a8598ea013f76dbb0"],["/js/layout/header.js","4aa0fb1ffcbdafe278f363c7bb2fb34c"],["/js/layout/loading.js","715537e05b27a70f7e2ed5555ab1a69d"],["/js/layout/post.js","efef5dbdea39ea806c6e0e4f52f5975f"],["/js/layout/sidebar.js","7d1eb636ce735839d375ad4742306e59"],["/js/libs/axios.min.js","848cc157033c57da268e171927a1ba92"],["/js/libs/lunr.min.js","dda8b6277f4495054278882952d89639"],["/js/page/post.js","89a4cbd103db83127c74fb02fd679e1a"],["/js/page/search.js","a038fefd0a0c2fe39eee4b9ec7f2077b"],["/live2dw/lib/L2Dwidget.0.min.js","32973883fcac0a9ae6cc79c0ea25fda2"],["/live2dw/lib/L2Dwidget.min.js","094cbace49a39548bed64abff5988b05"],["/page/2/index.html","641794f4d51eaa8202deacc8ed6a42cf"],["/page/3/index.html","a30ccb91f59a4dd4a31cfce05ae9e35f"],["/page/4/index.html","0a61e3d1a2d6fede1fd8b12e6cd8bd62"],["/page/5/index.html","14cedffab88aa33504c22a7d2446c685"],["/page/6/index.html","437786e23816a5e391342594ef7ed58c"],["/page/7/index.html","1c06dd0051915e311dc851f44e278f91"],["/page/8/index.html","5791bc75acbc891a4f53d100f49d3844"],["/page/9/index.html","e1e52a5bf53764c38482a5c1d9899393"],["/posts/alibaba_code_style_exam.html","f2d762e0e37dde70408672c14fbaf08c"],["/posts/alibaba_frank_code_style.html","86ca161e30f31519df92aa2738b2a9ed"],["/posts/anime_recommed.html","fe72a4be3d397437483445eb79611005"],["/posts/design-patterns-adapter.html","8834a6f6f96fbf39ef52e01b0f771dc2"],["/posts/design-patterns-builder.html","cd5b9008f8b1c0ad994e618425feb0ff"],["/posts/design-patterns-chain-of-responsibility.html","0da87f3bd350f3cab148d4236a1cc520"],["/posts/design-patterns-composite.html","39ecbedc84a70c075df7ceea3ae5550d"],["/posts/design-patterns-decorator-model.html","7a0d546436afffe116ea4296071e7550"],["/posts/design-patterns-event_design.html","6f2b9ee6622b0b2e6c5b0d879b2dbbed"],["/posts/design-patterns-flyweight.html","9c9947b97e0f87f18a3e75856f7465fb"],["/posts/design-patterns-future-callback.html","bc46b3c6d9192677a5a306742116c440"],["/posts/design-patterns-immutable.html","6069cf9d03380f7adab5b01cb6ce2f58"],["/posts/design-patterns-observer.html","0b70be5bee096ac35af8f4258b408a2e"],["/posts/design-patterns-producer-consumer.html","3f2457333b7c49fee5987b63893fd4ea"],["/posts/design-patterns-proxy.html","c574f934dce637877aa605c6a64ab9da"],["/posts/design-patterns-strategy.html","fbb22db7d58c9748f4c58b2c068a0760"],["/posts/design-patterns-template-method.html","08c6c65d6e2aa31aa8754fbf3da8d209"],["/posts/design-patterns-thread-specific-storge.html","b598f2bb2ad39363cd8db8d37821aa49"],["/posts/design-patterns-visitor.html","6eb8a8c6212c0388f7c7d11a6aea3495"],["/posts/developer_core_ability.html","f9e5daf23262f159813d155847cbb9f4"],["/posts/framework-double-extension.html","14f3e3f1d44037450078780fd1a84c12"],["/posts/framework-double-loadbalance.html","7c599f0886690caab2746abb7a35144b"],["/posts/framework-double-replace.html","2b40c04ce70dbc37ace9fac070f259aa"],["/posts/framework-guava-bloomfilter.html","4b797d7cbe6c9d201c49b42f42f93bf8"],["/posts/framework-mockito.html","1c55078deede988485eae8dfa83a54b0"],["/posts/framework-mybatis-mapper-proxy.html","8c095879da4ac9766087a88729f01dfc"],["/posts/framework-mybatis-result-set-handler.html","65a216c6c9e895e481d373740d09e4bf"],["/posts/framework-mybatis-sql-analysis.html","bbb250f695d975461e0d76fbad2b51a0"],["/posts/framework-mybatis-sql-session.html","db4b00e37162ae509909e047adc3c257"],["/posts/framework-mybatis-type-handler.html","a3dad828c0bc6ebfe5a2c81e6bdc85c8"],["/posts/framework-netty-bytebuf.html","3912ffe89ddf9fbfb7565f99b35405da"],["/posts/framework-netty-half-packet.html","a6b35b02932322c48f750634bd3ad80b"],["/posts/framework-netty-reactor-model.html","b0d28d58514062addf7657199e26ae2e"],["/posts/framework-spring-apo-ioc.html","33d3303597c04dbbf7648c0757d02da9"],["/posts/framework-spring-autoconfig.html","7e54f8bdda4e4f1a1290cf7fc64b12de"],["/posts/framework-spring-cache.html","8b6d08b8e3b37109e31ff89376343e97"],["/posts/framework-spring-jar-in-jar.html","c29a05b123a11eedbba72f702f88f11c"],["/posts/framework-spring-mvc-params.html","565dba8218c1ba83d24519f26f0878ef"],["/posts/framework-spring-schedule.html","257a50416b916902fde9ad33cc77c124"],["/posts/framework-springmvc-exception.html","ddf36ce7cecd29c4ec02806e3f10cc69"],["/posts/framework-springmvc-framework.html","a76fedb5701b196ad432d203ce4d4aa1"],["/posts/framework-springmvc-request.html","6c002dd54918ff243052afbc06605077"],["/posts/framework-springmvc-return.html","a242b5428a3084d343a50e3b905fa59e"],["/posts/hello-world.html","6e1d80a12c130a8e0d1bd9ba72402a35"],["/posts/idea_plugin_decompile.html","ac8b28137298412c4c77d1f59d34c306"],["/posts/java-string-pool.html","6eec75575797471eca10844349010065"],["/posts/java_abstract_interface.html","cea3cd045af92096c6485198871a853c"],["/posts/java_box_unbox.html","39d4ae4278990cb629aa8f2493445fc8"],["/posts/java_cas.html","923fe5fcf0d75e0818de2d3165596748"],["/posts/java_classloader.html","e9bb0e1fce3ca7be3ee564b6e2ed94de"],["/posts/java_close_file.html","bd9cea7482ce3fdde4f83fa706df98d7"],["/posts/java_deadlock.html","b718954d55169c8607ef73d839baada3"],["/posts/java_deque.html","33d96b719c41a13b02f2e0b4ebec44cb"],["/posts/java_enum.html","097f7b1c3e7efb03cdc1435c2cafdd11"],["/posts/java_longadder.html","2e51de675b20a740b2d073d664658618"],["/posts/java_metaspace.html","c03394273c94fc55ae26fe581cd100a8"],["/posts/java_readwritelock.html","f739f5233080eda482d3741aef6d395d"],["/posts/java_reference.html","ab82b6d6bd3ee662f72d14000098732c"],["/posts/java_serializable.html","1fd3b28b73c027d5d074dde7d9bb2253"],["/posts/java_stream1.html","60393125c67e6d9dbcb11edb55c6b95d"],["/posts/java_stream2.html","1a3c4e4ffc4741536d99c96448f4326c"],["/posts/java_stream3.html","dfb697c010e706c0fd821d491ae070a9"],["/posts/java_stringbuilder.html","0cde9461a17976b128c23ad90ecf4b2b"],["/posts/java_threadlocal.html","67b5c237770410766c9fd1d8eb970981"],["/posts/java_threadpool_completablefuture.html","c4ddd6d02bdae7bbee12b40b2599b368"],["/posts/job_interview_2017.html","c36a78a1f45f3f3960bf2576f2ec9455"],["/posts/job_interview_2018.html","a0f140c0dfbfdac0610b7bcbbef35ac3"],["/posts/linux-expect_script.html","95da2316d097e386d729dfa1361e76da"],["/posts/linux_tcp_close_wait.html","f65b3de85eca9623e7ca8608e27af71b"],["/posts/mysql-distributed-lock.html","2a8d34eebd17dde6316bdc1918a292da"],["/posts/mysql-index-guide.html","dfa27c1a49c3206b988ebc0371dba56a"],["/posts/mysql-lock-handle.html","e341b016a75cb0c9a4eb5bd7327eb4b2"],["/posts/osx_app_switcher.html","6ee589d9b53f7ad09f413476c2a9ddf5"],["/posts/osx_install.html","1dac63a04ebbf9fce85797cff7659900"],["/posts/readnote-http.html","9afef74d1e43c6ba4d2c465e70ab8fc3"],["/posts/readnote-maven_in_action.html","fe4f7ef93860e720ccf392d5d4491fb2"],["/posts/readnote-mysql-45-summary.html","c019393b747f9837dc235ae97ebafa13"],["/posts/readnote-pro-git.html","fe17aef016de083a0bdf072b79c427b1"],["/posts/readnote-regex.html","baee467ce268dfbee4837cf0a1828d66"],["/posts/readnote-source-mybatis.html","f4210fbb252780f5d4c5d4704e7ce735"],["/posts/storage-ssd.html","aac152807bff12f9ca31f3d43ce8c5c8"],["/posts/tools-alfred-cmd-search.html","1e750c562e992239699133aba03c60e5"],["/posts/tools-cors-anywhere.html","d9969a078856a7da435253de8ce2a867"],["/posts/tools-dalgen.html","4bec599cee1652544f30b85032a6b404"],["/posts/tools-excel.html","3cda884e94f5a6db1f600fb0363d30bc"],["/posts/tools-hosts.html","fe5336e22de777de48b5d1ac02bf6bee"],["/posts/tools-time-convert.html","76d4b77175543ae8f2d05761faf27a22"],["/posts/tools-v2ray-cloudflare.html","fed017876f503495954fd32b173b7dde"],["/posts/work-design-binary.html","2a5fac84059197a99bdce59d0a4f0532"],["/posts/work-design-command-model-in-action.html","dbb7bb69515817765da3c3434ec77c32"],["/posts/work-design-common-selected.html","aefcdd9b0487d9ad7218fde970d999b5"],["/posts/work-design-java8-timezone.html","ce299d251c5970b066686b0675cac26d"],["/posts/work-design-jwt.html","4e1cca09e676e5c19e8fcd4a49dcfdfb"],["/posts/work-design-microkernel-biz.html","16aa32c793cd172fe2b97f0fbe03c7db"],["/posts/work-design-velocity-sql-inject.html","a6be62dc16d0389c65c9ab26289a5b2d"],["/posts/work-how_config_log.html","ce81f618a2f9ff4e67e134a0156cef6e"],["/posts/work_how_design_user_login.html","d3451f86d4dc723546428a045b792855"],["/scss/base/index.css","6cdc21c715c8f464f3f640d5fab16363"],["/scss/views/page/about.css","65dc429be5de1d73a1575d58365b94e9"],["/scss/views/page/archive.css","d70685972f811fe10b2dcbad21e825d7"],["/scss/views/page/category.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/error.css","a28c9232c644781481405306b9762ad1"],["/scss/views/page/index.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/post.css","dd2fcf4bd6fb18230128c376d924b34c"],["/scss/views/page/search.css","0376462c0ec6b41476a1df1358bb3de0"],["/scss/views/page/tag.css","859fbbf6bae99a4926c013a87a150947"],["/search/index.html","8f4baea2c5e94ce9958d2187a0fddb5c"],["/tags/Alfred/index.html","59142637406fb637e0d6d4c54318db3d"],["/tags/Dubbo/index.html","469c01393b9bd240a23f606a2cad53a2"],["/tags/Guava/index.html","f53f1856c0db8b776f222158e2e771a5"],["/tags/IntelliJ/index.html","5c2490f0e532cff4a03d157eac2ca0e9"],["/tags/JUC/index.html","ec6eee1b1bd73b476b6d18b75a7eea46"],["/tags/JWT/index.html","9849c1d0a3718118178e763034db1c8d"],["/tags/Java/index.html","25661d4258c2af93fb95a4779c07bdd9"],["/tags/Java/page/2/index.html","85f173698dd6c2cdcc22fa3500216c97"],["/tags/Mockito/index.html","f103a3e8b2000f126dfd480015f0e4a2"],["/tags/MySQL/index.html","0da1a6b335f55a062bd895f12d3966dd"],["/tags/Mybatis/index.html","9cad09e01a78058d64043407ed3f9273"],["/tags/Netty/index.html","399853cdd0ccb6c721c7a371c7f13336"],["/tags/OSX/index.html","dc242685eb76a04710b3178d5630b46b"],["/tags/Spring/index.html","18df11d75d0590a176c120b5057e3ad1"],["/tags/index.html","7af38549dfa4f9dabbb2b38b857118d7"],["/tags/动漫/index.html","d42fd145c2c4a9587cd0685888f8c512"],["/tags/实战/index.html","1230e0223c2f582638f7539424ca9cd8"],["/tags/工作/index.html","88f3d2eb4c1db3a0e7a21bd955249838"],["/tags/设计模式/index.html","37590f8ad7e30cacb29015856fdb9bda"],["/tags/设计模式/page/2/index.html","9641feafa7199722675fb429f6078509"],["/tags/读书笔记/index.html","894ced95ffb8cc0d6a33083a8e9f5af8"],["/tags/转载/index.html","063e4f4c13188308362a1dfb5b71aea5"],["/tags/轮子/index.html","9ae271248365939077b74f9f651e9f37"]];
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




