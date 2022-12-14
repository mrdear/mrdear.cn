---
title: 造轮子-- time-format-alfred插件
subtitle: 利用Alfred的workflow制作的一款时间转换工具
cover: http://res.mrdear.cn/zaolunzi2.png
author: 
  nick: 屈定
tags:
  - 轮子
  - Alfred
categories: 工具
urlname: tools-time-convert
date: 2019-01-30 21:38:22
updated: 2019-01-30 21:38:25
---
由于目前在做国际相关的业务，对于多时区时间转换很频繁，恰巧发现了[github.com/noaway/dateparse](https://github.com/noaway/dateparse)这个神奇的仓库，其所提供的时间解析函数支持非常多的时间格式，配合alfred workflow可以打造出实用性超高的解析工具，于是开干！

## download

1. [https://github.com/work-helper/time-format-alfred](https://github.com/work-helper/time-format-alfred)
2. `repository -> release -> 选择最新版本`


## quick start

1.下载并安装workflow

2.配置常用时区，格式为 `./time-format-alfred -time={query} UTC America/Los_Angeles`,直接在后面追加即可，使用逗号隔开

![](http://res.mrdear.cn/1548854492.png)

3.输入时间`time now`，可以使用now代指当前时间

![](http://res.mrdear.cn/1548854370.png)

4.输入时间`time 1548854618000`

![](http://res.mrdear.cn/1548854650.png)

5.输入时间以及指定该时间所属时区`time 2019-01-30 21:24:44,gmt-7`,表示当前时间是GMT-7时区的时间,同样其他时间也同样支持该时区表示方法。

![](http://res.mrdear.cn/1548854736.png)

6.支持格式列表
```go
var examples = []string{
	"May 8, 2009 5:57:51 PM",
	"Nov 8, 2017",
	"Mon Jan  2 15:04:05 2006",
	"Mon Jan  2 15:04:05 MST 2006",
	"Mon Jan 02 15:04:05 -0700 2006",
	"Monday, 02-Jan-06 15:04:05 MST",
	"Mon, 02 Jan 2006 15:04:05 MST",
	"Tue, 11 Jul 2017 16:28:13 +0200 (CEST)",
	"Mon, 02 Jan 2006 15:04:05 -0700",
	"Mon Aug 10 15:44:11 UTC+0100 2015",
	"Fri Jul 03 2015 18:04:07 GMT+0100 (GMT Daylight Time)",
	"12 Feb 2006, 19:17",
	"2013-Feb-03",
	//   mm/dd/yy
	"3/31/2014",
	"03/31/2014",
	"08/21/71",
	"8/1/71",
	"4/8/2014 22:05",
	"04/08/2014 22:05",
	"04/2/2014 03:00:51",
	"8/8/1965 12:00:00 AM",
	"8/8/1965 01:00:01 PM",
	"8/8/1965 01:00 PM",
	"8/8/1965 1:00 PM",
	"8/8/1965 12:00 AM",
	"4/02/2014 03:00:51",
	"03/19/2012 10:11:59",
	"03/19/2012 10:11:59.3186369",
	// yyyy/mm/dd
	"2014/3/31",
	"2014/03/31",
	"2014/4/8 22:05",
	"2014/04/08 22:05",
	"2014/04/2 03:00:51",
	"2014/4/02 03:00:51",
	"2012/03/19 10:11:59",
	"2012/03/19 10:11:59.3186369",
	//   yyyy-mm-ddThh
	"2006-01-02T15:04:05+0000",
	"2009-08-12T22:15:09-07:00",
	"2009-08-12T22:15:09",
	"2009-08-12T22:15:09Z",
	//   yyyy-mm-dd hh:mm:ss
	"2014-04-26 17:24:37.3186369",
	"2012-08-03 18:31:59.257000000",
	"2014-04-26 17:24:37.123",
	"2013-04-01 22:43:22",
	"2014-12-16 06:20:00 UTC",
	"2014-12-16 06:20:00 GMT",
	"2014-04-26 05:24:37 PM",
	"2014-04-26 13:13:43 +0800",
	"2014-04-26 13:13:44 +09:00",
	"2012-08-03 18:31:59.257000000 +0000 UTC",
	"2015-09-30 18:48:56.35272715 +0000 UTC",
	"2015-02-18 00:12:00 +0000 GMT",
	"2015-02-18 00:12:00 +0000 UTC",
	"2017-07-19 03:21:51+00:00",
	"2014-04-26",
	"2014-04",
	"2014",
	"2014-05-11 08:20:13,787",
	//  yyyymmdd and similar
	"20140601",
	// unix seconds, ms
	"1332151919",
	"1384216367189",
	// Chinese date
	"2017年11月09日",
	"2017年11月01日 09:41",
	// How long ago
	"1 day ago",
	"19 hours ago",
	"26 minutes ago",
}
```