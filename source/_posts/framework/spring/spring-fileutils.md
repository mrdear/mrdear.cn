---
title: Spring -- 常用的文件工具类
subtitle: Spring中提供的文件操作工具类
cover: http://imgblog.mrdear.cn/mrdearblog-springboot.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-fileutils
date: 2019-09-13 08:57:18
updated: 2019-09-13 08:57:23
---

Spring几乎是当前Java后端项目必备框架之一，其内部有着大量的工具类，了解并熟练使用这些工具类能够节省不少的时间，本文对Spring中文件操作相关工具类进行汇总，希望对日常开发有所帮助。

## 字节流复制工具：StreamUtils
该工具类主要针对`InputStream`，`OutputStream`，`byte[]`，`String`之间相互转换进行一层封装，以`org.springframework.util.StreamUtils#copyToString`方法为例，其内部通过StringBuilder作为数据接收容器，写入对应的byte[]，最后再输出为String。

**清单1: StreamUtils拷贝源码**
```java
public static String copyToString(@Nullable InputStream in, Charset charset) throws IOException {
		if (in == null) {
			return "";
		}
        // 接收输出
		StringBuilder out = new StringBuilder();
        // 准备读取相关啊流
		InputStreamReader reader = new InputStreamReader(in, charset);

		char[] buffer = new char[BUFFER_SIZE];
		int bytesRead = -1;
        // 边读边写
		while ((bytesRead = reader.read(buffer)) != -1) {
			out.append(buffer, 0, bytesRead);
		}
		return out.toString();
	}
```

## 文件复制工具类：FileCopyUtils
该工具类和`StreamUtils`高度相似，在`StreamUtils`功能基础上提供了直接对文件的操作`copy(File in, File out)`，本质方式还是Stream的字节流拷贝。

## 文件系统操作类：FileSystemUtils
该工具类主要提供目录级别的文件删除，以及拷贝能力，其内部的能力基本是`Files`该JDK工具类提供。

## 字节流：FastByteArrayOutputStream
用于替代`java.io.ByteArrayOutputStream`的类，针对`ByteArrayOutputStream`类，其内部基于数组实现，当写入数据庞大时，其扩容操作就会很频繁，扩容会先创建更大的数组，然后把老的数据拷贝进去，再把要写的数据追加进去。
针对`FastByteArrayOutputStream`，其实现理念是使用链表`LinkedList<byte[]> buffers`拼接数组，达到无数组拷贝的效果，每次容量不够时，则直接创建新的数组，然后追加到链表尾节点，类似下图，整个字节流尾123456789，对应到`FastByteArrayOutputStream`则为4段数组。

在Netty中的`CompositeByteBuf`实现原理与其类似，其本质是组合设计模式思想，有兴趣可以参考我的另一篇文章 [设计模式--组合模式的思考](https://mrdear.cn/2018/04/01/experience/design_patterns--composite/)
**清单2: FastByteArrayOutputStream原理**
![](http://imgblog.mrdear.cn/1568300417.png?imageMogr2/thumbnail/!100p)

## 资源访问类：ResourceUtils
资源访问基本是基于URL协议格式来定制，比如访问文件为`file:`，访问jar为`jar:`，该工具类提供的就是根据这些协议去访问对应文件以及判断文件类型的能力，最终会调用`java.io.File#File(java.lang.String)`构造方法构造出对应的文件。

## 序列化操作：SerializationUtils
该工具类对基本序列化，反序列化操作工具化封装。本质是`ObjectOutputStream`，`ObjectInputStream`两个类的的写入与读取能力。

## 统一资源访问：Resource
Spring中使用`Resource`接口统一了不同类型资源的访问，并提供了诸多实现类，可以便捷的加载底层的不同资源，常用的如以下列表：
- FileSystemResource：本地文件访问
- FileUrlResource：基于URL协议的文件访问
- ClassPathResource：ClassPath下文件
- ServletContextResource：web目录下文件

## Ant-style资源解析：PathMatchingResourcePatternResolver
`PathMatchingResourcePatternResolver`是Spring提供的`Ant-style`路径解析工具，该方法解析后能够返回对应的`Resource`，达到批量获取资源的情况，比如在Mybatis框架中，需要批量获取对应的xml文件，则可以按照如下示例获取：

**清单3: 利用resouces获取mybatis文件**
```java
   SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setVfs(SpringBootVFS.class);
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] shorturlResources = resolver.getResources("cn/mrdear/shorturl/repository/tinybiz/tunnel/**/*.xml");
        // 放入mapper文件
        factoryBean.setMapperLocations(shorturlResources);
```

## properties资源访问：PropertiesLoaderUtils
`PropertiesLoaderUtils`该工具类提供了`Resource`与properties之间的转换合并能力。

