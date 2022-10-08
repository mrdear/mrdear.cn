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

var precacheConfig = [["/about/index.html","61a859b2b5a991e98553faf8a0ae06de"],["/archives/2017/01/index.html","97bfe7db3d06a8ec66dbac5d11c08dc1"],["/archives/2017/03/index.html","35a19bc3e68784810ab6b386cdfc80ae"],["/archives/2017/05/index.html","3502b23332defb24e574195337eeb342"],["/archives/2017/07/index.html","5ed1af264cf21d17ddfe8c33df528f98"],["/archives/2017/08/index.html","214cab7320b1d65d7c79be58f24871e9"],["/archives/2017/09/index.html","5433c367e564d7e053bed224da32fbaf"],["/archives/2017/10/index.html","3272cf770e49b54482ec80120a25ac35"],["/archives/2017/11/index.html","fe50f1f9688a25f200184999fda2172d"],["/archives/2017/12/index.html","1ecf13b84766d911fc8750d7edf50647"],["/archives/2017/index.html","afa84933cbaac090a56a1901df838708"],["/archives/2017/page/2/index.html","9981fc24eea5e5ae2371f1171e66d46d"],["/archives/2018/01/index.html","a113ea5e26128926c843d264c5b6afb3"],["/archives/2018/02/index.html","be14209a2b0c1a7ce98fd7cc38ef89a4"],["/archives/2018/03/index.html","d2dbdfd348c727a32bedc0d1dc6d563e"],["/archives/2018/04/index.html","f679cd2e1a9156d4033bc772f1ec2abd"],["/archives/2018/05/index.html","faf6dd69065c8475d9dbcadcdc34e21e"],["/archives/2018/06/index.html","895ff670ae57e925532f78f0efb1e3ec"],["/archives/2018/07/index.html","e82de5291bd5acbed75b4bad95488d86"],["/archives/2018/08/index.html","c3b280fc492997704dcb6cc8481cad4f"],["/archives/2018/09/index.html","d3cd09e63af41ee5bdd50f8b3a94cb50"],["/archives/2018/10/index.html","98195df6c5a2e6a229f92da8037a8abd"],["/archives/2018/11/index.html","dfb35efdd2cef7b9302c01551f4afcde"],["/archives/2018/index.html","af173bd0a364dedb47392b807f9a252a"],["/archives/2018/page/2/index.html","33c80cce10a069b1b89f77483e010f2a"],["/archives/2018/page/3/index.html","7964858da631a231152e9d784330d3d8"],["/archives/2018/page/4/index.html","4640470f31a6e126d270b9ad45cd6f46"],["/archives/2019/01/index.html","162352b01c61c201e3ee2412b229e5a2"],["/archives/2019/02/index.html","0349a3077ce78d9679c132b7f3669268"],["/archives/2019/03/index.html","eee0fdb9891abc2108333f23eee89a13"],["/archives/2019/04/index.html","be75543549b9d58399b1657ee45388bb"],["/archives/2019/09/index.html","fce71d6ebee87c0cf45dbd9266d37ccc"],["/archives/2019/10/index.html","d30c10d6b068f4adbb6487701dd00026"],["/archives/2019/12/index.html","9917f42d4db92fa28bbaa4aacaee5bce"],["/archives/2019/index.html","ef759fef0be196c897f860666161af9a"],["/archives/2019/page/2/index.html","05ded4cb332b5e4dafb97c9b7f804815"],["/archives/2020/01/index.html","1bb1dc4f6e12b9d4b3357872ef3db3a9"],["/archives/2020/02/index.html","08f4ed430f10978d892f00929cc26e34"],["/archives/2020/03/index.html","a66cca52de0a6656e5a0d0debe423f15"],["/archives/2020/05/index.html","0f083721cffe0eb855c01ff4e5ef2783"],["/archives/2020/06/index.html","3e0767697eff2fb98dc659e079ffce6d"],["/archives/2020/07/index.html","dcc6079ee94af54edf4c3d31678d74ce"],["/archives/2020/08/index.html","a434414677faffad1df8ad66934f9853"],["/archives/2020/10/index.html","8e730ca0f0b5568bc1b692b3e8428f99"],["/archives/2020/11/index.html","ed44a471cdd1b738e6bc6b23ca96fbd1"],["/archives/2020/12/index.html","d5cde8558bae1c6ed11f0ebd5833c7ab"],["/archives/2020/index.html","e4851c49dadf877660f57ab31a412506"],["/archives/2020/page/2/index.html","456b78e57c644c7340ce4979288646f4"],["/archives/2021/02/index.html","86b6ca5c8fa663141b97d7fceef5d549"],["/archives/2021/05/index.html","575102bd986843bb2f1f9b68ff23f4cc"],["/archives/2021/index.html","b3d5e5f59e9456909d698569c728e95c"],["/archives/2022/02/index.html","7ea9490457c731199e5a114bac76b14e"],["/archives/2022/07/index.html","a07cf45c0e3a832ccb6e1c4d45003a8c"],["/archives/2022/10/index.html","8b9d5c62663da86791e66ea9e27a2f48"],["/archives/2022/index.html","cdd7b43411d4e437331e81a48f00107d"],["/archives/index.html","ea2439d4e4e91184a45c48156923033e"],["/archives/page/2/index.html","302bf97d6747fea271628ddb3b8d6fd7"],["/archives/page/3/index.html","397eee6002684780d86182ce50dfbeab"],["/archives/page/4/index.html","3819235d27920a3fe2b9ab026bc7bd90"],["/archives/page/5/index.html","f18a54714b7072053656df3ca64892af"],["/archives/page/6/index.html","52e59d9a9e7dd209dce537ebc0f81da5"],["/archives/page/7/index.html","6e5785f08a675905a1b2a033338a6089"],["/archives/page/8/index.html","08b0f4fc8148acda3472afde3112c6a6"],["/archives/page/9/index.html","7cf62e0fe9a850fbce540ea62bbf98bc"],["/categories/Spring系列专题/index.html","0e1ee44b2786570a32df7ed04418f84e"],["/categories/index.html","fc286daed271e979779a0094b60c68e2"],["/categories/夯实Java基础/index.html","8a30140ee93dac7d72d7b5544d26ea96"],["/categories/夯实Java基础/page/2/index.html","4669b9a558e68ed1bc6a6636b6c2a2a6"],["/categories/实战总结/index.html","40aa9cdc37858a110570f86a3d25acae"],["/categories/工具/index.html","1d62e59d8df2e4f2a8e693df91f7ecc4"],["/categories/操作系统/index.html","fed84d1a747502bcbe044c86819a64b7"],["/categories/杂七杂八/index.html","bca78873f34698a1f2e3bc76cdd8b98a"],["/categories/框架与中间件/index.html","fc73ad8bc6f6153823f71cd7f7ce9711"],["/categories/框架与中间件/page/2/index.html","fbe808e7434b59e8c2835b985587c508"],["/categories/设计模式专题/index.html","de9b90e1839c9607a1d033b3cbb51fdb"],["/categories/设计模式专题/page/2/index.html","0fd6e36ef68fa548d52204b5aee949e3"],["/categories/读书笔记/index.html","cf5326bb82846778befceddeb2c6411e"],["/categories/转载/index.html","05b7e0dc3e712a52a7dd1c6357457fa8"],["/fonts/iconfont.eot","3fdccc279c6fc8af79d5113865d6fd59"],["/fonts/iconfont.svg","3e969604074b7369f3738f1bfdb9472d"],["/fonts/iconfont.ttf","34e141c95d70fbc6429318aed1564d30"],["/fonts/iconfont.woff","d658c2b8af244e42eb9685090c1cf81c"],["/index.html","3bcb147b51b10af5db7e19a1c44a85d1"],["/js/common/animation.js","4caf20a8d9b703a7415fc8c612e5aa64"],["/js/common/pack.js","aaa8d447cd5892b20fc2606824f0adb4"],["/js/common/utils.js","ebab2468b6979f1099edf8717643c65a"],["/js/layout/back-top.js","08fb4885c251c95a8598ea013f76dbb0"],["/js/layout/header.js","4aa0fb1ffcbdafe278f363c7bb2fb34c"],["/js/layout/loading.js","715537e05b27a70f7e2ed5555ab1a69d"],["/js/layout/post.js","efef5dbdea39ea806c6e0e4f52f5975f"],["/js/layout/sidebar.js","7d1eb636ce735839d375ad4742306e59"],["/js/libs/axios.min.js","848cc157033c57da268e171927a1ba92"],["/js/libs/lunr.min.js","dda8b6277f4495054278882952d89639"],["/js/page/post.js","89a4cbd103db83127c74fb02fd679e1a"],["/js/page/search.js","a038fefd0a0c2fe39eee4b9ec7f2077b"],["/live2dw/lib/L2Dwidget.0.min.js","32973883fcac0a9ae6cc79c0ea25fda2"],["/live2dw/lib/L2Dwidget.min.js","094cbace49a39548bed64abff5988b05"],["/page/2/index.html","21c503016b766b01c41f67990675dc9d"],["/page/3/index.html","d6e1ff805f100f9c3f9210d64549861a"],["/page/4/index.html","e8302b0084555dde72fdc07cd1779073"],["/page/5/index.html","d84b5b69e52e63666689ef4cfa55485a"],["/page/6/index.html","356d863e7988f47755f84e78e79e0756"],["/page/7/index.html","dae5284e62e8bb0cfa7b3434ead377f8"],["/page/8/index.html","6ea5cf7af70457934719439907d1125c"],["/page/9/index.html","cd809976db206a58115b6d3fcca5577e"],["/posts/alibaba_code_style_exam.html","6bca58b51b538837470898efdc2587f6"],["/posts/alibaba_frank_code_style.html","21a1806a7affbff4f338038894fa22c6"],["/posts/anime_recommed.html","afb9e18b143a342c64cbf8ab25fcd874"],["/posts/design-patterns-adapter.html","136cee4b29b1b2e405cb96965d8ee253"],["/posts/design-patterns-builder.html","05d6778a1eb1e571dd88d51926798a57"],["/posts/design-patterns-chain-of-responsibility.html","de9633e4d5a3d1fb5e9dd373e60e3776"],["/posts/design-patterns-composite.html","ceee972d23833f9297972c94b421c07b"],["/posts/design-patterns-decorator-model.html","6e57afb6354be31261a274e2dd12eabe"],["/posts/design-patterns-event_design.html","3e2b352a9592a80ce1ed2f9ee715e270"],["/posts/design-patterns-flyweight.html","8c5d2fe2a5e4532db13fe35edb23b7e9"],["/posts/design-patterns-future-callback.html","8bdb93710c2b9752cf05e3d3d3f14977"],["/posts/design-patterns-immutable.html","187dcbf587b78f77fbe3d07d7940de49"],["/posts/design-patterns-observer.html","0978bb4d5b00f1f93bb374bf72b883ab"],["/posts/design-patterns-producer-consumer.html","a285fad9d413056ad89155b0e2fa7e6b"],["/posts/design-patterns-proxy.html","ea9b21c98eb9abdb6c9a94a4e4fbd891"],["/posts/design-patterns-strategy.html","92fd1dd713acc746a764cec3be792f54"],["/posts/design-patterns-template-method.html","d84214d83bd2424490337dc6e923548f"],["/posts/design-patterns-thread-specific-storge.html","556cf712d4f3c0d19146142482aff860"],["/posts/design-patterns-visitor.html","293645ec9cf2bbeeb6a234f62e81c5ad"],["/posts/developer_core_ability.html","537f65c70d54eb39abafe055e56ce496"],["/posts/framework-double-extension.html","1e546338f9edba2208a59bb9727fdc90"],["/posts/framework-double-loadbalance.html","041bd224c1274fd8dc3aeaf68d693cfa"],["/posts/framework-double-replace.html","d0c1164444bad34d3637be66887cccce"],["/posts/framework-guava-bloomfilter.html","036e95627ccac998aae7e6ef213cbb79"],["/posts/framework-mockito.html","16c9d98272ec40344e200d1cd79dd9e4"],["/posts/framework-mybatis-mapper-proxy.html","fb2908e064abf6c3c9585dc6c37bf674"],["/posts/framework-mybatis-result-set-handler.html","4a664dcac93cae2cbe0011027e6b29a8"],["/posts/framework-mybatis-sql-analysis.html","60b3b5302711465791c02e720bf29c97"],["/posts/framework-mybatis-sql-session.html","7bab901ec6a030ebe1b00eb764013c8a"],["/posts/framework-mybatis-type-handler.html","ec9eb8ed0f596518f1bde4f77058710f"],["/posts/framework-netty-bytebuf.html","e9a45b691ca76fd6050e6ac4be5242bc"],["/posts/framework-netty-half-packet.html","9e09dc935940b22604de437eb3f7b6bc"],["/posts/framework-netty-reactor-model.html","16d08a241985fdc0d3f6c8ae24140b80"],["/posts/framework-spring-apo-ioc.html","9c051d5079c7684d276af50ff4e34d9a"],["/posts/framework-spring-autoconfig.html","7c18589bbf0b458094182eba506c1593"],["/posts/framework-spring-cache.html","4db522090101d29e2972883ba5f44a97"],["/posts/framework-spring-jar-in-jar.html","6dfe1ce0b7c1f09b1dfff611dfe9e214"],["/posts/framework-spring-mvc-params.html","8642b975f303e2df9f410ba510644bb1"],["/posts/framework-spring-schedule.html","d9ffc5b2119f263fb1f09e2d7f0df071"],["/posts/framework-springmvc-exception.html","03d553e5dd08af8416c14af12fd7e271"],["/posts/framework-springmvc-framework.html","28ba509746e5cc0fdc391d5b5b7958b4"],["/posts/framework-springmvc-request.html","a22765c866789a50d5dfd145b13c5492"],["/posts/framework-springmvc-return.html","8c41f7f45b343d074812e39283197bc1"],["/posts/hello-world.html","2144211252d8a4a957054d830ef1b47b"],["/posts/idea_plugin_decompile.html","16a8f79a23c7b8637ccc13596ef91cf5"],["/posts/java-string-pool.html","95fa82e387c3941db86f85b53f8d7a7c"],["/posts/java_abstract_interface.html","4f367f50215215d60c0e4230a127b509"],["/posts/java_box_unbox.html","68d674957af421056cd3233d148ffac0"],["/posts/java_cas.html","30f68ebed91a7e2ba369a01ca8ab0062"],["/posts/java_classloader.html","932c4332af9580b91d2c7e35cc64eb3f"],["/posts/java_close_file.html","620765057a0e269ef16b05657dc4446d"],["/posts/java_deadlock.html","832bc3feb27305a515a5f0e5693605ef"],["/posts/java_deque.html","d04a7ea834b0ea4e5cd1e67323f1cc2b"],["/posts/java_enum.html","08eec7f2d7ef23a31a253f0554f97331"],["/posts/java_longadder.html","f6acc109b3f9a3f2e185d862beadb7e2"],["/posts/java_metaspace.html","28e356d0e35269de63ea9c4dcc3184da"],["/posts/java_readwritelock.html","7970bb212e19d3f1a18a6704b84d6b92"],["/posts/java_reference.html","a09dafdc94ac58c7c2723809621b4870"],["/posts/java_serializable.html","b3419e1e637df23c46babe3c95060cbe"],["/posts/java_stream1.html","b4825a90604f6078bfafaf9ea538ff6b"],["/posts/java_stream2.html","95e9e02a43d99b68b346d18df7d9fac5"],["/posts/java_stream3.html","15ea155cf344878442b308b8cde69f48"],["/posts/java_stringbuilder.html","0dd58673c8258390a403749af624f047"],["/posts/java_threadlocal.html","8dcc8d2eaba58f163a40bb55c2097954"],["/posts/java_threadpool_completablefuture.html","0e1563ffbc2ebb2125dd55d42a807e9d"],["/posts/job_interview_2017.html","c06cc0cc7438b826b022a292dfa300d3"],["/posts/job_interview_2018.html","eb591eebeeed59dfad24f0bc7d1cb612"],["/posts/linux-expect_script.html","bce1d71c094dffcc8d53875ec705d5c1"],["/posts/linux_tcp_close_wait.html","1d0629ee67b44ef87d0af00c4140cd85"],["/posts/mysql-distributed-lock.html","2c0090b0fd12ab53ca2f4d70c25d3651"],["/posts/mysql-index-guide.html","1e3bf640edc199aa48c235e3f584a9ec"],["/posts/mysql-lock-handle.html","9937fb29c32e86104a341fa73287cd7d"],["/posts/osx_app_switcher.html","f063966ec5e70ec03b47fa690dee789a"],["/posts/osx_install.html","238b3fd62e1688327cfbc0848d4cc76b"],["/posts/readnote-http.html","ec4adf1ed9f875912c7edaad8443ea8f"],["/posts/readnote-maven_in_action.html","04e104c2c60b573ff5faa1609032b689"],["/posts/readnote-mysql-45-summary.html","f6b209b7d2b7bb2acbf190327523e459"],["/posts/readnote-pro-git.html","92fbfa27c1a7aaf889e298de8c11771d"],["/posts/readnote-regex.html","85ba39e8b5e0918de07f9ab4737c4cdf"],["/posts/readnote-source-mybatis.html","37d507a4da9fd63c32bd2b2ed3883e83"],["/posts/storage-ssd.html","5db8cb0be1c52087fc758b50c09cddd5"],["/posts/tools-alfred-cmd-search.html","df6fd2e9cab22552d4d6817b8a86833f"],["/posts/tools-cors-anywhere.html","2d998a658e34dab75569527e2b8ae0f1"],["/posts/tools-dalgen.html","31f802147b363dbe37485de5eea5e7d8"],["/posts/tools-excel.html","8e8a1e401ffaf6fb15e7bed92abd35be"],["/posts/tools-hosts.html","b045fa1f891afaf32560ac976dfcd927"],["/posts/tools-time-convert.html","65488b55a68c84098cefa90e8a3cc3cc"],["/posts/tools-v2ray-cloudflare.html","64e7e16269c5870ad4ddd8da807a2689"],["/posts/work-design-binary.html","fd409936a43d7e8bcd5150fe9f4b5ca8"],["/posts/work-design-command-model-in-action.html","966d80858d2d5c54c04acb8a859165ff"],["/posts/work-design-common-selected.html","0178f05a20b48d7a4b9bbe5f1ad8af4f"],["/posts/work-design-java8-timezone.html","c0ed7c008228f3632f50cc1e565788ce"],["/posts/work-design-jwt.html","70c72d7b5784a6d11271b95815759c1f"],["/posts/work-design-microkernel-biz.html","2bef6e003403a3479f59d0ca2aeafcbd"],["/posts/work-design-velocity-sql-inject.html","7e480797dc8190271b127c69acd28f25"],["/posts/work-how_config_log.html","38f7bbfc1f2b9c132b73ad0906f557cc"],["/posts/work-read-rome-source.html","47fae93ebe507d562aae31a95c739be0"],["/posts/work_how_design_user_login.html","f697273ba76c5dc3e567e26d0951fdd4"],["/scss/base/index.css","6cdc21c715c8f464f3f640d5fab16363"],["/scss/views/page/about.css","65dc429be5de1d73a1575d58365b94e9"],["/scss/views/page/archive.css","d70685972f811fe10b2dcbad21e825d7"],["/scss/views/page/category.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/error.css","a28c9232c644781481405306b9762ad1"],["/scss/views/page/index.css","859fbbf6bae99a4926c013a87a150947"],["/scss/views/page/post.css","dd2fcf4bd6fb18230128c376d924b34c"],["/scss/views/page/search.css","0376462c0ec6b41476a1df1358bb3de0"],["/scss/views/page/tag.css","859fbbf6bae99a4926c013a87a150947"],["/search/index.html","d183e52a3788ade3ebeccdf2f65e5891"],["/tags/Alfred/index.html","55649f25e43a38f5ccaf5a7603d9cc63"],["/tags/Dubbo/index.html","a2daf15289d58257d2307ab28bb263b8"],["/tags/Guava/index.html","45a0d8e02cc7a3bb85c4f2656ee5f5cc"],["/tags/IntelliJ/index.html","5c9ae3168c81a54459ecd9dcd51fe583"],["/tags/JUC/index.html","3fce7dca09599b136bfe4c5a6d534c7c"],["/tags/JWT/index.html","c1fc9b62b69f162106adaef967b115c9"],["/tags/Java/index.html","facbf080d950a01777453a2266a03184"],["/tags/Java/page/2/index.html","478569879411139c31e3a6bcda9a96b1"],["/tags/Mockito/index.html","c16191dd91d8336139d7b52f6a5bdf13"],["/tags/MySQL/index.html","f95d86f44356ee3cceae5850766cda68"],["/tags/Mybatis/index.html","fd7fba62a8e16cb1220c36c42f756ac6"],["/tags/Netty/index.html","559873b18da9834b9ccbf2beeadeb22d"],["/tags/OSX/index.html","fd0b19f88352f2a0c5267f79e0b090ad"],["/tags/Spring/index.html","007487b612b6ef1bae4c2caae3280a83"],["/tags/index.html","d2f5ff702ff91427c3fb4d7bf5f8229b"],["/tags/动漫/index.html","4067829f520fa79f0d9943aab25907f5"],["/tags/实战/index.html","a1dab18a1746b56b655f16d73c093d2f"],["/tags/工作/index.html","3659027def40e87c74c9da4a6bd06252"],["/tags/设计模式/index.html","d0d1afe8490650cab25f306389917952"],["/tags/设计模式/page/2/index.html","5daafec46478df7b7fbaf052ec9f601e"],["/tags/读书笔记/index.html","fdbbdd174e177085f9fcf2b156eabea9"],["/tags/转载/index.html","6c4fd872fc6eebcf2f934cc7dd6a9025"],["/tags/轮子/index.html","06638e0fb40cfa23f766a089c1ab0a32"]];
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




