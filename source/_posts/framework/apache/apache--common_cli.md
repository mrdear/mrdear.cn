---
title: Apache--common-cli工具解析
subtitle: apache-common-cli使用解析
cover: http://imgblog.mrdear.cn/mrdearblog-apache-common-cli.png
author: 
  nick: 屈定
tags:
  - Apache Common
categories: 框架与中间件
urlname: framework-apache-common-cli
date: 2018-11-11 15:07:44
updated: 2018-11-11 15:07:44
---

无意中发现了`apache-common-cli`这款小而美的命令行解析工具，顿时充满了兴趣，该篇文章分析其实现原理。

## 命令行格式
命令行一般有`-`和`--`的参数形式，不管之前的Unix，BSD，GNU等如何定义，按照现在大众认知一般认为`-`表示缩写命令，方便快速输入，`--`表示全命令，主要用于完整描述该命令。
**清单1：-与--区别**
```sh
ls -a    ==     ls --all
ls -A    ==    ls --almost-all
```
当然也有另类，比如java，对于这种忽略吧。。。
**清单2：Java奇怪的命令行**
```sh
java -v 错误
java --version 错误
java -version 正确
```

## common-cli
`apache-common-cli`解析命令行主要使用了三个组件：
1. Option：描述程序所能接收的命令
2. CommandLineParser：解析器，能够解析用户输入的参数
3. CommandLine：解析结果


### Option
一个`org.apache.commons.cli.Option`代表着程序的一个参数，其承载着该参数的配置信息，比如短命令格式，长命令格式，是否必须，参数类型等等，因此该类需要有很多字段来描述这些属性，如下图所示：
![](http://imgblog.mrdear.cn/1541832617.png?imageMogr2/thumbnail/!100p)
属性多带来的是初始化的繁琐，因此该类的设计使用了Builder设计模式，Builder设计模式本质上是一种特殊的工厂，按照指定的流水线生产对象，最后在build()前对对象进行检查，保证产出合格对象。

一款软件往往有着众多的命令，为了更加简化该方式，`common-cli`使用`org.apache.commons.cli.Options`类提供更加友好的创建方式，`Options`类为`Option`的集合，提供了众多方法对`Option`的创建封装，方便开发者使用。
![](http://imgblog.mrdear.cn/1541833486.png?imageMogr2/thumbnail/!100p)

因此在使用`common-cli`时可以如下形式，灵活的选择需要的初始化方式。
**清单1：命令初始化**
```java
      Options options = new Options()
            .addOption("a", "all", false, "ls -a")
            .addOption("R", "recursive", false, "ls -R")
            .addOption(Option.builder("r")
                .longOpt("reverse")
                .hasArg(false)
                .desc("ls -r")
                .build());
```

### CommandLine
`org.apache.commons.cli.CommandLine`是经过`Parse`解析后产出的结果，主要包含已识别命令集合以及未识别的命令集合。
**清单2：CommandLine结构**
```java
    /** the unrecognized options/arguments */
    private final List<String> args = new LinkedList<String>();

    /** the processed options */
    private final List<Option> options = new ArrayList<Option>();
```

### CommandLineParser
解析器是`common-cli`的核心，目前官方推荐使用`org.apache.commons.cli.DefaultParser`作为实现类，从该实现类的结构中可以看出其并不是一个线程安全的实现，解析过程中会将很多中间状态保存在全局变量中，主要解析方法为`CommandLine parse(final Options options, final String[] arguments)`方法，解析流程看下来不是很复杂，大致为匹配到相应场景就去尝试，尝试失败再使用其他场景，因此该部分会针对一些问题进行分析。

#### 命令值如何解析？
参数的形式主要有以下几种，匹配规则也是到对应的`Option`时，尝试去获取后面的参数。
```sh
-SV  # 如果S命令有值则直接把后面的字符串当成值.
-S V  # 设置中间状态,下一轮匹配则附加上值
-S=V # 等号后面的为值
-S1S2 V # 该形式要求S1必须是无参命令,S2参数则与上述匹配类似
-SV1=V2 # 这种类似jvm参数 -DskipTest=true,忽略-D与上述类似
```

#### 混合命令如何解析？
所谓的混合命令比如`ls -la`实际上为`ls -l -a`，对于该命令解析`common-cli`会把参数拆分成单个字符，然后遍历匹配一遍，一旦发现匹配则加入到匹配集合中。
```java
 protected void handleConcatenatedOptions(final String token) throws ParseException{
        for (int i = 1; i < token.length(); i++){
            // 混合命令会拆分成字符
            final String ch = String.valueOf(token.charAt(i));
            // 对每一个字符进行匹配
            if (options.hasOption(ch))
            {
                // 匹配成功的加入到commandLine中
                handleOption(options.getOption(ch));

                if (currentOption != null && token.length() != i + 1)
                {
                    // add the trail as an argument of the option
                    // 获取参数值
                    currentOption.addValueForProcessing(token.substring(i + 1));
                    break;
                }
            }
            else
            {
                handleUnknownToken(stopAtNonOption && i > 1 ? token.substring(i) : token);
                break;
            }
        }
    }
```

#### 如何线程安全的使用？
`Parser`类并非线程安全的实现，在解析过程中中间状态存储，以及结果存储都需要使用共享变量形式传递，如果想要线程安全的使用，可以使用[Thread Specific Storge模式](https://mrdear.cn/2018/05/20/experience/parallel_design_patterns--thread_specific_storge/)，该模式的解决思路是不共享单个变量，共享一堆变量，每一个变量被获取后只与一个线程绑定。

## 总结
apache的项目规范就是好，无论是代码注释，还是单测都十分完善，哎，上班能遇到这样的代码多好。