---
title: 实践 -- 项目日志配置经验分享
subtitle: 项目中日志配置相关经验分享
cover: http://res.mrdear.cn/mrdear_logger.png
author: 
  nick: 屈定
tags:
  - 实战
categories: 实战总结
urlname: work-how_config_log
date: 2020-03-29 17:20:38
updated: 2020-03-29 17:20:42
---

Java中日志生态是比较乱的，因此在项目中如何使用日志成了一个开发者必须考虑的问题，本文针对工作中日志包使用做一个总结。

## 日志分类
日志包虽然很多，但大体上分为三类
- 门面日志类，代表为SLF4J，JCL，其存在的目地是统一应用调用输出日志方式。
- 日志实现类，代表为Log4j，Logback，Log4j2等，其真正拥有日志输出能力。
- 桥接类：代表为slf4j-log4j12，log4j-slf4j-impl等相关包，其目地是在其他jar强引用第三方日志实现包的情况下，桥接相关第三方日志到应用本身日志实现。

那么最佳实践自然是一套门面，一套实现，其他都为桥接，如下图所示，这种方式下结构非常清晰，且日志实现类可以随时更换，不会影响到现有应用，目前主流组合有 slf4j + logback + 各种桥接，slf4j + log4j2 + 各种桥接，配置时可以作为参考。
也因此日志该如何配置即变成了如何保证应用中有且仅有一套门面，一套实现日志框架。

![](http://res.mrdear.cn/1585407394.png)

## 门面日志以及桥接的实现原理
在分析之前，我们大致可以想象到，门面日志相当于定义了一套输出日志的标准API，桥接类相当于复写了对应实现类，然后在内部将对应日志行为转接到slf4j，接下来以slf4j+log4j2为例，描述这一流程。

### Slf4j如何绑定实现类日志
如下代码所示，在slf4j中`org.slf4j.LoggerFactory#bind`方法会使用`StaticLoggerBinder.getSingleton()`完成实现类日志绑定，而`StaticLoggerBinder`由对应实现类日志提供，比如使用log4j2实现时，则由`log4j-slf4j-impl`jar提供该类。

**清单一： slf4j日志绑定**
```java
Set<URL> staticLoggerBinderPathSet = null;
// 检查是否存在多个实现类,存在则报警
if (!isAndroid()) {
    staticLoggerBinderPathSet = findPossibleStaticLoggerBinderPathSet();
    reportMultipleBindingAmbiguity(staticLoggerBinderPathSet);
}
// 完成日志实现类绑定
StaticLoggerBinder.getSingleton();
// 置为绑定成功状态
INITIALIZATION_STATE = SUCCESSFUL_INITIALIZATION;
reportActualBinding(staticLoggerBinderPathSet);
```

桥接的目地是获取到`ILoggerFactory`，由其提供对应日志类`Logger`，完成绑定输出。

### 桥接类如何到Slf4j
不同的类桥接方式不太一样，以JUL为例，其桥接包`jul-to-slf4j`提供了`SLF4JBridgeHandler`类，该类继承了`java.util.logging.Handler`，针对JUL日志的日志输出会转到`org.slf4j.Logger`输出，从而实现了桥接。另外`log4j-over-slf4j`的实现方式，则是完全复写log4j库，提供一样的Class接口，但是内部日志输出使用的是`org.slf4j.Logger`，从而完成了桥接。

原理实际上很简单，这其中容易配错的就是桥接方向，比如同时引入了 jcl-over-slf4j 与 slf4j-jcl，前者是桥接jcl到slf4j，后者是桥接slf4j到jcl，那么必然**死循环**，造成内存溢出。


### 如何配置日志
按照一套门面，一套实现，其他都为桥接的标准，日志配置可以分为三个步骤：第一步，引入门面日志框架；第二步，排除多余的日志实现类框架；第三步，引入相关桥接包，排除多余桥接包。按照简单的三个步骤策略，可以轻松配置日志，另外在整个过程中可以画图辅助，这样能够快速帮助你定位到问题所在。

## 日志怎么管理
解决日志配置问题后，管理也是个大问题，随着应用迭代增多，如果不加以控制，日志文件实际上会越来越多，因此收口到一个工具类是非常必要的选择。比如针对报警事件，可以收口到一个alarm.log的日志，使用不同的marker区分，针对监控日志可以收口到monitor.log，使用marker区分，错误日志则全部收口到error.log，防止多处打印。
工具类实现，首推策略枚举模式，管理方便，调用简单，还便于在日志上增加各种属性配置，如清单二代码实例所示，该LogUtils不但提供了枚举调用方式，还提供了静态方法调用方式，方便外部存在 logger对象时调用，另外还可以通过匿名类方式，为单一日志对象提供额外方法，灵活性可以说极其自由。

**清单二：策略枚举实现日志工具类**
```java
public enum LogUtils {
    /**
     * 通用监控日志
     */
    MONITOR(LoggerFactory.getLogger("monitor")),
    /**
     * 通用报警日志
     */
    ALARM(LoggerFactory.getLogger("alarm")),
    ;


    public final Logger logger;
    
    LogUtils(Logger logger) {
        this.logger = logger;
    }

    /**
     * 输出info日志
     * @param msgTemplate 日志模板
     * @param params 日志参数
     */
    public void info(String msgTemplate, Object... params) {
        if (logger.isInfoEnabled()) {
            logger.info(msgTemplate, params);
        }
    }
    
    /**
     * 输出info日志
     * @param msgTemplate 日志模板
     * @param params 日志参数
     */
    public void info(Marker marker, String msgTemplate, Object... params) {
        if (logger.isInfoEnabled()) {
            logger.info(msgTemplate, params);
        }
    }

    /**
     * 输出error日志
     * @param msgTemplate 日志模板
     * @param params 日志参数
     */
    public void error(String msgTemplate, Object... params) {
        if (logger.isErrorEnabled()) {
            logger.error(msgTemplate, params);
        }
    }
    
    /**
     * 输出info日志
     * @param logger 日志文件
     * @param msgTemplate 日志模板
     * @param params 日志参数
     */
    public static void info(Logger logger, String msgTemplate, Object... params) {
        if (logger.isInfoEnabled()) {
            logger.info(msgTemplate, params);
        }
    }

    /**
     * 输出error日志
     * @param logger 日志文件
     * @param msgTemplate 日志模板
     * @param params 日志参数
     */
    public static void error(Logger logger, String msgTemplate, Object... params) {
        if (logger.isErrorEnabled()) {
            logger.error(msgTemplate, params);
        }
    }

。。。。。等方法

}

```

## 总结
日志配置实际上并没有很多可以说的东西，只要理解了日志体系，配置是很简单的事情，希望本文对你有帮助。
