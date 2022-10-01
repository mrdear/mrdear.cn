---
title: 实践 --多时区下应用时间加减以及DB字段选择
subtitle: 借由工作中遇到的问题，理解时间以及时区问题。
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - 实战    
categories: 实战总结
urlname: work-design-java8-timezone
date: 2019-12-01 11:37:36
updated: 2020-04-11 08:46:00
---

国际业务往往比国内业务复杂很多，其中一点就是多时区，洛杉矶时间2019.11.3号,正值夏令时切换时踩了一把坑，该篇文章记录下问题，并给出多时区下时间操作比较合理的做法。

## 问题简介

### 背景

由于线上服务器采用的都是`America/Los_Angeles`时区，因此会涉及夏令时，夏令时的意思是在`2019-11-3 02:00:00 `时会回拨1小时到`2019-11-3 01:00:00`，然后时钟继续，相当于当天会有25个小时，那么夏令时会带来哪些问题？
1. 字符串时间无法反向转换为精确时间，比如 `2019-11-3 01:30:00`就无法转换为一个具体的unix timestamp，因为无法确定该时间点位于回拨前还是回拨后。
2. 这一天不再是24小时，由于时间回拨了1小时，针对`Los_Angeles`这一天实际上有25个小时。
这两点是导致本次问题的原因。

### 问题
问题复现代码如下所示，执行时需要把本地时间调整为`America/Los_Angeles`。
```java
    /**
     * 错误的示例
     * 本地时间为LA时区
     */
    @Test
    public void test() throws ParseException {
        // 字符串一般都隐含时区问题,这里假定这个字符串为GMT+8时区        
        String gmt8Date = "20191104";

        // 得到东八区下该时间戳,此时时间戳对应的为东八区 2019-11-04 00:00:00
        FastDateFormat ymd = FastDateFormat.getInstance("yyyyMMdd", TimeZone.getTimeZone("GMT+8"));
        Date gmtDateInstance = ymd.parse(gmt8Date);
        
        // 时间减一,此时会受到本地时间影响, LA时区下20191103这一天有25个小时
        Date date = DateUtils.addDays(gmtDateInstance, -1);
        
        // format出来结果为20191102
        String preDate = ymd.format(date);
    }
```

问题的本质原因是我们大多数时候默认一天有24个小时，然而夏令时切换当天一天有25个小时，同样冬令时切换当天，一天会有23个小时，而出现问题的代码是`DateUtils.addDays(gmtDateInstance, -1)`，减1天，**需要判断当前一天到底多少个小时**，而Apache的该工具类默认使用了本地时区来判断，导致这里实际上减了25个小时，因此再转到东八区时间为`2019-11-02 23:00:00`，也就是结果中的20191102

### 解决方案
找到原因了，自然很好解决，时间的加减需要感知到具体时区信息，解决方案是使用JDK8的ZoneDateTime。
```java
    public Date addDay(Date date, int day) {
        Instant instant = ZonedDateTime.ofInstant(date.toInstant(), this.pattern.getZone())
            .plusDays(day)
            .toInstant();
        return new Date(instant.toEpochMilli());
    }
```
`ZoneDateTime`在构建时已经包含了时区信息，因此加减会根据当前时间来判断具体的变化值。更多的代码可以参开我Github：[DateFormat.java](https://github.com/mrdear/code-collection/blob/master/java-utils-collection/src/main/java/cn/mrdear/collection/util/DateFormat.java)

JDK8已经相当普及，其增加的`java.time`相当优秀，新代码建议应该抛弃掉Date类，转抱Java8 Time，顺便这里分享下个人的Java8 Time笔记,希望对你有帮助.
<iframe style="height:100%;width:100%;min-height:1000px" frameborder=0 src="https://mubu.com/doc/3S_Z7AssCU" name="屈定的java.time学习笔记"></iframe>


## 应用与DB时区
db中常用的为TimeStamp以及Datetime两个字段，两者的区别如下：
- Timestamp：以UTC时间戳作为内部存储，没有时区含义，仅仅是显示时会转换为对应时区时间字符串展示。
- Datetime：以字符串常量形式存储，本质上隐含了写入时的时区信息，因此时区切换会造成隐藏时区丢失。

一个应用写入数据到DB过程中，需要经历以下三个模块
![](http://res.mrdear.cn/1582431086.png?imageMogr2/thumbnail/!100p)

其中把MySQL当成服务端，那么应用以及MySQL驱动都可以作为客户端，客户端之间可以认为以Date类传输，Date类内部就是时间戳，因此不会发生时区丢失，那问题就变成了客户端与服务端之间时间是如何传输？通过Debug源码可以发现，客户端接收到的服务端范围为byte[]数组，使用String方法序列化后，为不带时区信息的`yyyy-MM-dd HH:mm:ss`字符串, 详细代码可以参考`com.mysql.cj.protocol.a.MysqlTextValueDecoder#getTimestamp`。客户端与服务端之间通过**字符串传输**，字符串默认隐含时区，因此会发生时间丢失，搞明白了传输，那么网上最常见的几种错误例子就很好懂了。
![](http://res.mrdear.cn/1582638478.png?imageMogr2/thumbnail/!100p)

### MySQL写入时间延迟8小时？
针对这种情况，一般有两种可能性，第一种应用时区GMT+8，MySQL驱动时区没有配置或者也是GMT+8，MySQL时区为UTC，那么传输流程如下图，因为客户端与服务端是字符串传输，导致时区丢失，最终写入时间则延迟8小时。
![](http://res.mrdear.cn/1582431095.png?imageMogr2/thumbnail/!100p)

第二种情况，应用时区GMT+8, MySQL驱动时区UTC，MySQL时区为GMT+8，那么传输流程如下图，同样本质原因也是字符串传输丢失了时区信息。
![](http://res.mrdear.cn/1582431104.png?imageMogr2/thumbnail/!100p)

### 该怎么解决
如果可以修改MySQL Server时区，最佳方案肯定是应用，Driver，MySQL Server三者时区保持一致，一致的话，是最不会出问题的情况，也是最便于理解的情况，其次如果业务是多时区，那么字段尽量选择**TimeStamp**，存储时间戳，即使切换时区也不会受到影响。
当无法修改MySQL Server时区时，那么可以通过Driver来控制当前连接session下的时区，达到修改MySQL Server时区效果，具体举个例子，应用运行在UTC时区，MySQL Server运行在GMT+8时区，且由于某种原因无法变更。那么此时可以在连接中配置`serverTimezone=UTC&useLegacyDatetimeCode=false`，修改Driver的时区为UTC，然后在数据源配置`newConnectionSQL=set time_zone='+00:00'`，当建立连接后执行该SQL，设置session下Server的时区为UTC。
