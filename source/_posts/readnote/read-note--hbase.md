---
title: 读书笔记 -- Hbase
subtitle: 读Hbase权威指南的一些知识点记录
cover: http://imgblog.mrdear.cn/mrdearblog-hbase.png
author: 
  nick: 屈定
tags:
  - 大数据
  - Hbase
categories: 读书笔记
urlname: readnote-hbase
date: 2019-01-01 10:21:18
updated: 2019-01-01 10:21:25
---
后面做的项目估计要使用到Hbase，因此做知识储备。个人学习路线为参考慕课网相关教学视频，然后翻看Hbase权威指南，并未做很深的原理剖析。  
本次学习还有一些其他收获：

**1. 传统RDBMS的扩展思路是什么？**
传统关系型数据库一般早期是主从结构，一是数据安全的备份，二是读写分离分担主库压力，随着数据量的增加增加从节点，进一步降低主库压力，这些是建立在读远远大于写的情况下一种常规做法，在随着业务量的上升，终极解决方案是分库分表，分库分表解决了单一主节点写入的问题，可以把数据分散到多个主节点中，当然分库分表页带来了诸多的限制，比如事务，跨表或者跨库join。那么造成这些的根本原因是关系型数据库很难做到分布式，所以大家都是从应用层想办法解决数据库性能问题。
当然目前类似TiDB这样的分布式关系型数据库正在崛起，相信以后能够解决这些问题。

**2. Hbase分布式的思路**
Hbase并不是一个关系型数据库，其面对的场景时海量数据，所以吞吐量是它的目的。高吞吐量自然要使用分布式方案来解决，在Hbase架构中存在一个轻量级master节点，以及众多的region server节点，master只负责集群的管理以及分配工作，数据访问以及写入都通过region server节点进行处理，这是一种设计思路，region server与master可以理解为非强依赖，即使master挂了在短时间内也不会影响客户端的数据访问，而本身master节点又是轻量级，因此挂了快速重启即可，另一种思路就是主备master，当主master挂了之后切换到备用master，当然这样又使得应用本身复杂性增加了不少。
多个region server节点用于承担数据读写请求，那么就涉及到数据分片，Hbase与Redis很类似，其都有一个唯一的key标识，利用该值可以做sharding，Redis是最初就分为16000多个槽，然后数据分散到不同的槽当中，对于Hbase则动态的分配region，每一个region处理不同的分段rowKey，当region过大则动态分裂。

下面是本次学习笔记，后面有其他理解会在笔记中补充。

<iframe style="height:100%;width:100%;min-height:1000px" frameborder=0 src="https://mubu.com/doc/2Bbx3rYHXU" name="屈定的Hbase学习笔记"></iframe>

