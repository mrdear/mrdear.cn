---
title: Hive -- 从日志分析学习Hive（二）
subtitle: 从Nginx日志分析案例来阐述Hive的一些知识点
cover: http://imgblog.mrdear.cn/mrdearblog-hive.png
author: 
  nick: 屈定
tags:
  - 大数据
categories: 大数据
urlname: framework-hive-study2
date: 2018-10-20 17:07:24
updated: 2018-11-05 08:29:35
---

继续上篇，上一篇中数据已经导入到Hive中，并且去除双引号的UDF也编写完成，该篇将围绕着业务建立相关的表。

## 动态分区
从源数据中直接导入的数据可能并不符合最终的要求，一般都需要清洗阶段，这里新建一个dwd层表，该表与ods层的不同之处在于使用了时间作为分区字段，分区的本质对于Hive来说是表空间下的不同文件夹，当查询时如果指定分区就不需要扫描全部的文件。另外该表使用了`orcfile`格式存储，并且开启了`snappy`压缩算法，一般CPU速率远远大于硬盘速率，因此这是一种消耗CPU性能来弥补硬盘性能不足的策略，先立个flag，后面专门研究下hive中的存储格式以及压缩算法。
**清单1：清洗后的中间层表**
```sql
create external table if not exists dwd_mrdear_access_log(
    remote_addr string,
    remote_user string,
    request_url string,
    status string,
    size string,
    referer string,
    user_agent string,
    http_x_forwarded_for string
)
partitioned by (dt string)
stored as orcfile 
TBLPROPERTIES("orc.compress"="SNAPPY");
```
表建立后，自然要想办法把数据从源表中导入进来，这里使用动态分区,动态分区的原理是根据查询出来的字段列表最后的列作为分区字段，比如下面sql中分区字段为`dt`且只有一个，因此会使用`formatDate(time)`(自定义时间处理的UDF)的结果作为该分区值，然后进行分区处理，分区处理判断该分区有没有建立，没有则创建，然后插入数据。
**清单2：数据清洗ETL**
```sql
// 单个reduce对内存有限制，如果oom，则可以设置多个reduce处理
set mapred.reduce.tasks = 2;
// 数据导入
insert overwrite table dwd_mrdear_access_log
partition (dt)
select remote_addr, remote_user, removeQuota(request_url), status, size, removeQuota(referer), 
 removeQuota(user_agent),  removeQuota(http_x_forwarded_for), formatDate(time) as dt
from ods_mrdear_access_src_log DISTRIBUTE BY dt ;
```
**PS**
这里可能会报错，有几个参数控制着Hive的动态分区，根据错误进行调整。
**清单3：动态分区相关配置**
```sh
hive.exec.dynamic.partition=true/false #是否开启动态分区
hive.exec.dynamic.partition.mode=struct/nostruct  #表示
hive.exec.max.dynamic.partitions.pernode=100 #每个MR节点最多产生的分区数
hive.exec.max.dynamic.partitions=10000 #所有MR节点最大产生的分区数
hive.exec.max.created.files=10000 # 所有MR节点最大产生文件数
hive.error.on.empty.partition=false #空分区产生，是否报异常
```

### 动态分区的原理
动态分区的隐藏条件是**根据分区字段作为中间结果的分区输出条件**，举个例子，在上述导入数据的SQL中，当执行完`select xx from ods_mrdear_access_src_log DISTRIBUTE BY dt`时所产生的临时结果数据已经是分区后的结果，如下所示：
![](http://imgblog.mrdear.cn/1541318893.png?imageMogr2/thumbnail/!100p)
然后利用`MoveOperator`从临时目录移动到最终表空间下，需要合并的话还会执行`MergeOperator`把多个结果集合并成一个，完成动态分区。


## 查询计划explain
通过上面动态分区所需要的业务中间表已经建立，接下来是完成业务需求，比如统计HTTP状态码的分布，也就是200，400，404等请求的个数，通过hive很容易写出以下sql。
**清单4：统计状态码分布**
```sql
select status,count(1) as total from dwd_mrdear_access_log group by status;

# 查询结果
status	total
200    585504
206    447
301    3387
304    37804
400    3296
403    766
404    34285
405    9503
408    1
499    706
```
那么对于Hive来说，该SQL到底是怎么执行的呢？Hive通过查询计划Explain向开发人员展示整个查询流程，使用方式是在查询语句前加`explain`或者`explain extended`关键字，后者能看到更加详细的信息。在这之前先了解Hive的基本操作分类，如下表所示：

| 操作符   |    描述      |  描述类 |
|----------|:-------------:|:-------------:|
| TableScanOperator |  扫描hive表数据 | org.apache.hadoop.hive.ql.plan.TableScanDesc |
| ReduceOutOperator | 创建将发送到Reduce端的<key,reduce>对 | org.apache.hadoop.hive.ql.plan.ReduceSinkDesc |
| JoinOperator | Join两份数据 | org.apache.hadoop.hive.ql.plan.JoinDesc |
| SelectOperator | 选择输出列 | org.apache.hadoop.hive.ql.plan.SelectDesc |
| FileOutOperator | 建立结果数据，输出至文件 | org.apache.hadoop.hive.ql.plan.FileSinkDesc |
| FilterOperator | 过滤输入数据 | org.apache.hadoop.hive.ql.plan.FilterDesc |
| GroupByOperator | Group By语句 | org.apache.hadoop.hive.ql.plan.GroupByDesc |
| MapJoinOperator | /*+mapjoin(t)*/ | org.apache.hadoop.hive.ql.plan.MapJoinDesc |
| LimitOperator | Limit语句 | org.apache.hadoop.hive.ql.plan.LimitDesc |
| UnionOperator | Union语句 | org.apache.hadoop.hive.ql.plan.UnionDesc |
| FetchOperator | 客户端直接读取数据 | org.apache.hadoop.hive.ql.plan.FetchWork |
| MoveOperator | 移动数据文件 | org.apache.hadoop.hive.ql.plan.MoveWork |
更多的Operator可以在Hive源码中定位到`org.apache.hadoop.hive.ql.plan.Explain`注解，然后查看相应的逻辑。

`explain`会把SQL拆分为多个`STAGE`，`STAGE`之间会构成一个DAG图的依赖关系，根据DAG的关系决定执行方式。在执行流程就会拆分为对应的`Operator`，对于`select status,count(1) as total from dwd_mrdear_access_log group by status;`其执行流程如下（注释很详细）：
**清单5：查询计划注释**
```java
STAGE DEPENDENCIES:  # 这里展示任务依赖关系，即DAG图
  Stage-1 is a root stage
  Stage-0 depends on stages: Stage-1

STAGE PLANS:
  Stage: Stage-1
    Map Reduce  # 代表这是一个MR任务
      Map Operator Tree: # Map阶段
          TableScan # 1. 扫描表
            alias: dwd_mrdear_access_log
            Statistics: Num rows: 675699 Data size: 609083736 Basic stats: COMPLETE Column stats: NONE
            Select Operator # 2. 获取需要的列数据
              expressions: status (type: string)
              outputColumnNames: _col0 # hive内部会使用默认别名来屏蔽列名的影响
              Statistics: Num rows: 675699 Data size: 609083736 Basic stats: COMPLETE Column stats: NONE
              Group By Operator # 3. 根据获取的数据分组，执行对应的聚合函数
                aggregations: count(1) # 聚合操作的执行
                keys: _col0 (type: string)
                mode: hash # 聚合使用的是hash方式
                outputColumnNames: _col0, _col1
                Statistics: Num rows: 675699 Data size: 609083736 Basic stats: COMPLETE Column stats: NONE
                Reduce Output Operator # 4. 结果写到临时文件中，作为Map阶段输出
                  key expressions: _col0 (type: string)
                  sort order: + # 表示正向排序
                  Map-reduce partition columns: _col0 (type: string)
                  Statistics: Num rows: 675699 Data size: 609083736 Basic stats: COMPLETE Column stats: NONE
                  value expressions: _col1 (type: bigint)
      Reduce Operator Tree: # 代表这是一个Reduce任务
        Group By Operator # 5. 对Map阶段的结果再次聚合
          aggregations: count(VALUE._col0)
          keys: KEY._col0 (type: string)
          mode: mergepartial # 这里的聚合模式是合并分区结果
          outputColumnNames: _col0, _col1
          Statistics: Num rows: 337849 Data size: 304541417 Basic stats: COMPLETE Column stats: NONE
          File Output Operator # 6. 输出到临时文件中作为Reduce阶段结果
            compressed: false
            Statistics: Num rows: 337849 Data size: 304541417 Basic stats: COMPLETE Column stats: NONE
            table:
                input format: org.apache.hadoop.mapred.SequenceFileInputFormat
                output format: org.apache.hadoop.hive.ql.io.HiveSequenceFileOutputFormat
                serde: org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe

  Stage: Stage-0
    Fetch Operator # 7. 读取Reduce阶段结果，展示输出
      limit: -1
      Processor Tree:
        ListSink
```
转换为图则如下：
![](http://imgblog.mrdear.cn/1541236387.png?imageMogr2/thumbnail/!100p)

## Map以及Reduce数量
在Hive中可以使用其提供的参数来控制Map以及Reduce的任务数量，从而针对不同的需求最大化性能。

### Map数量
Hive是基于Hadoop的上层抽象，其Map本质是使用`org.apache.hadoop.mapred.InputFormat`从HDFS中读取数据，因此能起多少Map由具体的实现类中`getSplits`方法确定，一般情况下一个`org.apache.hadoop.mapred.InputSplit`就是一个Map。
在Hive中如果想影响拆分算法，一般使用`org.apache.hadoop.hive.ql.io.CombineHiveInputFormat`读取且合并小文件数据，然后使用以下参数影响拆分合并算法：
1. mapreduce.input.fileinputformat.split.minsize：每一个块最小size
2. mapreduce.input.fileinputformat.split.maxsize：每一个块最大size
3. mapreduce.input.fileinputformat.split.minsize.per.node：同一节点的数据块形成切片时，切片大小的最小值
4. mapreduce.input.fileinputformat.split.minsize.per.rack：同一机架数据块切片时最小值

### Reduce数量
Reduce数量主要由以下三个参数控制，其逻辑在`org.apache.hadoop.hive.ql.exec.mr.MapRedTask#setNumberOfReducers`方法中。
1. hive.exec.reducers.bytes.per.reducer (默认值: 256000000)：根据处理文件大小决定reduce数量，默认256Mb，如果是1G输入文件则对应4个Reduce任务。
2. hive.exec.reducers.max (默认值: 1009)  ：控制最大的Reduce数量
3. mapreduce.job.reduces (默认值: -1)：直接指定Reduce数量

## 业务需求
### 查询top受访页面
**清单6：top受访页面结果**
```sql
# SQL
select request_url, count(request_url) as total from dwd_mrdear_access_log group by request_url sort by total desc limit 10;

# 结果
request_url	total
GET /atom.xml HTTP/1.1	60869
GET / HTTP/1.1	15891
GET /robots.txt HTTP/1.1	6776
GET /fonts/iconfont.woff?t=1503327386217 HTTP/2.0	6207
GET /live2d/assets/mtn/idle.mtn HTTP/2.0	5824
GET /scss/base/index.css HTTP/2.0	5675
GET /live2dw/assets/mtn/idle.mtn HTTP/2.0	5626
POST /search/ HTTP/1.1	5590
GET /js/common.js HTTP/2.0	5548
GET /atom.xml HTTP/2.0	4842
```
根据查询可以看出来，RSS订阅地址以及首页访问频率最大，不过search页面为什么访问也这么大，并且还是POST，很不合理。查询下数据`select * from dwd_mrdear_access_log where request_url='POST /search/ HTTP/1.1' limit 10;`确认是某个客户端在一直请求，状态返回都是405.

### 查询top带宽页面
**清单7：top带宽页面结果**
```sql
select request_url, count(request_url) as total, sum(size/1024/1024) as size from dwd_mrdear_access_log group by request_url sort by size desc limit 10;

# 结果
request_url	total	size
GET /atom.xml HTTP/1.1	60869	15968.452551841736
GET /live2d/assets/moc/koharu.moc HTTP/2.0	3850	779.69225025177
GET /live2d/assets/moc/koharu.2048/texture_00.png HTTP/2.0	3699	763.9492750167847
GET /live2dw/assets/moc/koharu.moc HTTP/2.0	2400	488.95586681365967
GET /live2dw/assets/moc/koharu.2048/texture_00.png HTTP/2.0	2310	470.99531269073486
GET /live2d/assets/moc/koharu.moc HTTP/1.1	1803	420.5655183792114
GET / HTTP/1.1	15891	301.46044731140137
GET /live2dw/assets/moc/koharu.moc HTTP/1.1	875	208.76958084106445
GET /atom.xml HTTP/2.0	4842	142.66961765289307
GET /live2d/script.js HTTP/2.0	3797	123.83943176269531
```
根据结果live2d是真的占流量，拖慢网站速度，不过由于启用了PWA有一定程度的缓解。

## 参考
[Hive中如何确定map数](http://blog.javachen.com/2013/09/04/how-to-decide-map-number.html)
