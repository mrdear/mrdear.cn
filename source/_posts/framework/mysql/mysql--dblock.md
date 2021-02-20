---
title: MySQL--DB实现分布式锁思路
subtitle: 利用DB实现一个分布式锁
cover: http://imgblog.mrdear.cn/mrdearblog-mysql.png
author: 
  nick: 屈定
tags:
  - MySQL
categories: 框架与中间件
urlname: mysql-distributed-lock
date: 2019-10-07 09:06:02
updated: 2019-10-07 09:06:06
---
无论是单机锁还是分布式锁，原理都是基于共享的数据，判断当前操作的行为。对于单机则是共享RAM内存，对于集群则可以借助Redis，ZK，DB等第三方组件来实现。Redis，ZK对分布式锁提供了很好的支持，基本上开箱即用，然而这些组件本身要高可用，系统也需要强依赖这些组件，额外增加了不少成本。DB对于系统来说本身就默认为高可用组件，针对一些低频的业务使用DB实现分布式锁也是一个不错的解决方案，比如控制多机器下定时任务的起调，针对审批回调处理等，本文将给出DB实现分布式锁的一些场景以及解决方案，希望对你启发。

## 表设计
首先要明确DB在系统中仍然需要认为是最脆弱的一环，因此在设计时需要考虑压力问题，即能应用实现的逻辑就不要放到DB上实现，也就是尽量少使用DB提供的锁能力，**如果是高并发业务则要避免使用DB锁，换成Redis等缓存锁更加有效**。如清单1所示，该表中唯一的约束为`lock_name,timestamp,version`三者组合主键，下文会利用这三者实现悲观锁，乐观锁等业务场景。

**清单1: 分布式锁表结构**
```sql
CREATE TABLE `lock` (
  `lock_name` varchar(32) NOT NULL DEFAULT '' COMMENT '锁名称',
  `resource` bigint(20) NOT NULL COMMENT '业务主键',
  `version` int(5) NOT NULL COMMENT '版本',
  `gmt_create` datetime NOT NULL COMMENT '生成时间',
  PRIMARY KEY (`lock_name`,`resource`,`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 悲观锁实现
对于悲观锁业务中常见的操作有以下两种：
![](http://imgblog.mrdear.cn/1570368096.png?imageMogr2/thumbnail/!35p)

**针对A：**
A场景当一台机器获取到锁后，其他机器处于排队状态，锁释放后其他机器才能够继续下去，这种应用层面解决是相当麻烦，因此一般使用DB提供的行锁能力，即`select xxx from xxx for update`。A场景一般都和业务强关联，比如库存增减，使用业务对象作为行锁即可。需要注意的是，该方案本质上锁压力还是在数据库上，当阻塞住的线程过多，且操作耗时，最后会出现大量锁超时现象。

**针对B：**
针对B场景(tryLock)举个具体业务，在集群下每台机器都有定时任务，但是业务上要求同一时刻只能有一台能正常调度。
解决思路是利用唯一主键约束，插入一条针对`TaskA`的记录，版本则默认为1，插入成功的算获取到锁，继续执行业务操作。这种方案当机器挂掉就会出现死锁，因此还需要有一个定时任务，定时清理已经过期的锁，清理维度可以根据`lock_name`设置不同时间清理策略。

定时任务清理策略会额外带来复杂度，假设机器A获取到了锁，但由于CPU资源紧张，导致处理变慢，此时锁被定时任务释放，因此机器B也会获取到锁，那么此时就出现同一时刻两台机器同时持有锁的现象，解决思路：把超时时间设置为远大于业务处理时间，或者增加版本机制改成乐观锁。
```sql
insert into lock set lock_name='TaskA' , resource='锁住的业务',version=1,gmt_create=now()
success: 获取到锁
failed：放弃操作
释放锁
```

## 乐观锁实现
针对乐观锁场景，举个具体业务，在后台系统中经常使用大json扩展字段存储业务属性，在涉及部分更新时，需要先查询出来，合并数据，写入到DB，这个过程中如果存在并发，则很容易造成数据丢失，因此需要使用锁来保证数据一致性，相应操作如下所示，针对乐观锁，不存在死锁，因此这里直接存放业务id字段，保证每一个业务id有一条对应的记录，并且不需要对应的定时器清除。

```sql
select * from lock where lock_name='业务名称', resource='业务id';
不存在: insert into lock set lock_name='业务名称', resource='业务id' , version=1;
获取版本: version
业务操作: 取数据，合并数据，写回数据
写回到DB: update lock set version=version+1 where lock_name='业务名称' and resource='业务id' and version= #{version};
写回成功: 操作成功
写回失败: 回滚事务，从头操作
```

乐观锁写入失败会回滚整个事务，因此如果写入冲突很频繁的场景不适合使用乐观锁，大量的事务回滚会给DB巨大压力，最终影响到具体业务系统。

## 总结
分布式锁的原理实际上很容易理解，难的是如何在具体业务场景上选择最合适的方案。无论是哪一种锁方案都是与业务密切关联，总之没有完美的分布式锁方案，只有最适合当前业务的锁方案。

