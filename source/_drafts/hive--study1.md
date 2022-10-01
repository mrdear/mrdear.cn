---
title: Hive -- 从日志分析学习Hive（一）
subtitle: 从Nginx日志分析案例来阐述Hive的一些知识点
cover: http://res.mrdear.cn/mrdearblog-hive.png
author: 
  nick: 屈定
tags:
  - 大数据
categories: 大数据
urlname: framework-hive-study1
date: 2018-10-15 17:07:24
updated: 2018-11-04 17:07:24
---
该文章是`从日志分析学习Hive`系列的第一篇，该系列会从Nginx日志分析案例来阐述Hive的一些知识点，该系列需要有一定的HDFS以及Hive相关知识。
本系列以我的个人网站[https://mrdear.cn/](https://mrdear.cn/)日志为例，进行分析统计，我把样本日志上传到了CSDN[mrdear.cn Nginx相关日志](https://download.csdn.net/download/u012706811/10718424)，下载后自行PUT到HDFS中，路径为`/user/mrdear/mrdear_access.log.bak`。

## 日志装载
数据采集相关的暂时不考虑，这里日志文件已经在HDFS中，那么对于Hive来说要创建一张**外部表**，关联到HDFS对应的日志文件。
**清单1：nginx日志源数据表**
```sql
create external table if not exists ods_mrdear_access_src_log(
    remote_addr string,
    remote_user string,
    time string,
    request_url string,
    status string,
    size string,
    referer string,
    user_agent string,
    http_x_forwarded_for string
)
row format serde 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
"input.regex" = "([^ ]*) - ([^ ]*) (\\[.*\\]) (\".*?\") (-|[0-9]*) (-|[0-9]*) (\".*?\") (\".*?\") (\".*?\")"
)
stored as textfile
location '/user/mrdear/'
;
```
在这个流程中有以下几个知识点需要理解。

### 外部表的理解
Hive的定位是一款数据分析工具，其不负责存储，因此对于HIve来说只要知道怎么去取数据就可以进行分析。外部表使用`external`指定，使用`location`指定数据位置，外部表的意义是**数据的所有权分离**，外部表无法对源数据进行修改，即使删除了外部表对源数据也毫无影响。
反之当源数据有修改Hive这边也无法得知，比如外部分区表对应的源数据新增了一个分区，同时必须在hive的元数据信息中使用`alter table ... add partition(...) set location '...'`增加这个分区，否则hive无法感知新增的分区。

那么Hive针对外部表是如何处理Hive的数据导入呢？（**强烈建议手动做下实验**）
1. 对于load，会直接移动文件到对应的目录下。
2. 对于insert into，hive会先创建临时内部表，然后把文件数据拷贝到对应的外部表目录下
3. 对于insert overwrite,hive会清空外部表下的所有数据，然后拷贝新的数据过去，该命令一定要注意。

### 数据的读取流程
建表的时候指定的信息被称为Hive的元数据，Hive在执行诸如`select`的语句时会根据元数据以及用户的SQL翻译成MapReduce程序执行，整个流程可以描述为以下两种形式：
**清单2：数据读取写入流程**
```txt
# 数据的读取流程
HDFS File -> InputFileFormat -> <key,value> -> DeSerializer -> Row Object
# 数据的写入流程
Row Object -> Serializer -> <key,value> -> OutputFileFormat -> HDFS File
```

#### InputFileFormat与OutputFileFormat

对于HIve来说`stored as`决定了`InputFileFormat`与`OutputFileFormat`，比如以下例子
**1. textfile类型的输入输出**
```txt
inputFormat:org.apache.hadoop.mapred.TextInputFormat, 
outputFormat:org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat
```
**2. rcfile类型的输入输出**
```txt
inputFormat:org.apache.hadoop.hive.ql.io.RCFileInputFormat, 
outputFormat:org.apache.hadoop.hive.ql.io.RCFileOutputFormat
```
换句话说，如果想要自定义输入输出格式，则指定`inputFormat`与`outputFormat`两个值即可。

#### DeSerializer与Serializer
由inputFormat读取到的数据，往往都使用了一定的算法进行压缩或者优化，那么想要显示成肉眼能看得懂的数据，则需要反序列化`DeSerializer`，HIve建表的`row format`参数决定了序列化与反序列化的配置，比如在处理Nginx日志时，自定义了`org.apache.hadoop.hive.serde2.RegexSerDe`，使用正则进行序列化以及反序列化。

## Select查询
执行`select * from ods_mrdear_access_src_log limit 2;`查询验证，按照上述`ods_mrdear_access_src_log`的配置，可以推断出Hive使用`inputFormat:org.apache.hadoop.mapred.TextInputFormat`从HDFS文件中按行读取数据，然后使用`org.apache.hadoop.hive.serde2.RegexSerDe`转换为一个Row Object，最终输出如下，每一块内容分别对应一列则映射成功。
**清单3：解析Nginx日志结果**
```txt
101.81.245.5	-	[11/Mar/2018:22:42:59 +0800]	"GET / HTTP/1.1"	200	5451	"-"	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"	"-"
101.81.245.5	-	[11/Mar/2018:22:42:59 +0800]	"GET /scss/base/index.css HTTP/1.1"	200	3149	"http://mrdear.cn/"	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"	"-"
```

### 什么情况下可以避免MR
上述SQL并没有触发MR任务，因为Hive的查询有一种本地模式（`set hive.exec.mode.local.auto=true`），该SQL只需要定位到文件，取出前两条记录就好了，那么针对这种就不需要翻译成MR，使用explain可以判断一条SQL是否有执行MR操作。

## UD*F
自定义函数对于Hive来说本质上是一个开放接口，运行时找到该接口，创建对应的实例，按照内置的规则准备参数，调用方法，拿到返回值。自定义函数大概能分为以下几类：

### UDF（User-Defined-Function）
UDF是用户自定义函数，对于Hive来说通常处理单列数据，要求继承Java类`org.apache.hadoop.hive.ql.exec.UDF`，并写一个固定方法名为`doEvaluate`的函数。然后使用时HIve会先去拿到对应的UDF实例，然后通过反射调用`doEvaluate`方法，拿到返回值。
我的理解对于HIve来说，UDF的输入时有多种多样的，并且参数不定，因此没有很好地办法统一一个接口出来，因此出现了这种固定方法名的写法。

### UDAF（User- Defined Aggregation Funcation）
UDAF是用户自定义聚合函数，一个UDAF往往接收集合数据，然后返回一个单值，比如常用的`sum`，`avg`等，Hive要求一个UDAF必须实现`org.apache.hadoop.hive.ql.udf.generic.GenericUDAFResolver2`接口，一个UDAF的执行往往会贯穿整个MR的流程，以`sum`对应的`GenericUDAFSum`为例：在Map端任务时会执行一次`sum`聚集Map端的数据，到达Reduce端时再次执行`sum`聚集多个Map产生的结果数据。因此在自定义UDAF时除了相关的调用逻辑`org.apache.hadoop.hive.ql.udf.generic.GenericUDAFEvaluator#iterate`，还需要指定合并策略`org.apache.hadoop.hive.ql.udf.generic.GenericUDAFEvaluator#merge`以及其他的终态方法。
一个完整的UDAF生命周期为`创建实例` -> `调用init方法` -> `调用getNewAggregationBuffer方法拿到该结果缓存对象` -> `调用iterate进行计算` -> `调用terminatePartial完成该任务或者分区的计算并产出结果` -> `调用merge对多个分区结果进行聚合` -> `调用terminate完成输出`

### UDTF（User-Defined Table-Generating Functions）
UDTF是用户自定义表生成函数，Hive中最常用的UDTF为`explode`，其作用是把一行数组或者Map映射为多行，UDTF的生命周期为`创建实例` -> `调用initialize方法` -> `调用process方法`（该方法中会把结果使用`forward`收集起来）-> `调用close方法`。

### 使用UDF去除列中双引号
编写UDF函数
```java
public class RemoveQuotationsUDF extends UDF {

    public Text evaluate(Text input) {
        // If the value is null, return a null
        if(input == null)
            return null;
        // Lowercase the input string and return it
        String newStr = input.toString().replaceAll("\"", "");
        input.set(newStr);
        return input;
    }
}
```
然后导入hive中
```sh
 add jar /Users/quding/workspace/quding/hadoop/hive-udf/target/udf.jar;
create temporary function removeQuota as 'cn.mrdear.hive.udf.RemoveQuotationsUDF';
# 随便查询一个带引号的列，发现引号被去掉了
select removeQuota(request_url) from ods_mrdear_access_src_log limit 10;
```

## 参考
[How to understand and analyze Apache Hive query execution plan for performance](https://www.slideshare.net/HadoopSummit/how-to-understand-and-analyze-apache-hive-query-execution-plan-for-performance-debugging)
[GenericUDAFCaseStudy](https://cwiki.apache.org/confluence/display/Hive/GenericUDAFCaseStudy#GenericUDAFCaseStudy-Writingtheevaluator)