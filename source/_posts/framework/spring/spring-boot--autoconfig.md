---
title: Spring Boot -- 自动配置原理
subtitle: Spring Boot自动配置的原理分析
cover: http://imgblog.mrdear.cn/mrdearblog-springboot.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-autoconfig
date: 2019-01-19 10:19:45
updated: 2019-01-19 10:19:51
---

## 启用自动配置
在Spring Boot中自动配置一般使用`@EnableXXX`方式，Spring默认提供了`@EnableAutoConfiguration`来配置starter，另外还提供了类似`@EnableScheduling`来配置非starter的相关bean，从源码角度来看，两种方式本质上来说并没什么区别，其都使用了`@Import`来导入一个对应的配置入口类，然后正在启动中的Spring IoC容器会尝试初始化该类，那么该配置入口类相当于拿到了`ApplicationContext`，自然可以做很多的自由发挥。

**清单1：EnableAutoConfiguration源码**
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(EnableAutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {

	String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";
    // .......
}
```

**清单2：EnableScheduling源码**
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {

}
```

## 如何自动配置
所谓的自动配置就是执行具体的`Configuration`类，首先先看比较简单的`@EnableScheduling`注解，该注解对应的配置类为`SchedulingConfiguration`，在`SchedulingConfiguration`中往IOC中注入了一个`DestructionAwareBeanPostProcessor`处理器，用于扫描定时器方法，然后初始化整个定时器调度。
这个简单的自动配置也说明了`@EnableXXX`本质上是一个开关，告诉Spring该去配置哪些东西，该怎么配置这些东西。
**清单3：EnableScheduling对应的SchedulingConfiguration配置**
```java
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class SchedulingConfiguration {

	@Bean(name = TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public ScheduledAnnotationBeanPostProcessor scheduledAnnotationProcessor() {
		return new ScheduledAnnotationBeanPostProcessor();
	}
}
```
那么对于starter模块是如何做到自动配置的呢？答案是`@EnableAutoConfiguration`，该注解对应的配置类为`EnableAutoConfigurationImportSelector`，该类实现了`ImportSelector`接口，在Spring Boot的Application Context启动时会主动调用其`org.springframework.context.annotation.ImportSelector#selectImports`方法，那么自动注入的核心就在该方法中。

在`EnableAutoConfigurationImportSelector`在启动后回去扫描`META-INF/spring.factories`文件，该文件是Spring Boot提供的Starter自我配置的入口，以mybatis starter为例，其形式如下：
**清单4: mybatis starter配置**
```java
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration
```
其目地告诉Spring Boot使用`org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration`来配置我这个模块，Spring Boot获取到该配置后会经过一系列的判断(比如是否被用户手动exclude)，然后决定加载后将该类纳入Spring Boot的配置中去，让IoC容器去完成配置。到此整个自动配置发现流程就算完成，这种方式类似Java提供的SPI，利用classpath下的配置信息达到批量自动配置的目地。

## 如何利用自动配置
自动配置的原理是很简单的，总结起来就两种，如果你想要让用户主动配置，那么可以提供一个自定义的`EnableXXX`注解，在该注解中import对应的配置类，如果你想让Spring Boot再启动的时候自动配置，那么在`META-INF`下提供对应的spring.factories文件，让Spring自动加载对应的配置类。

Spring Boot利用这种做法能让模块与模块之间解耦，所有的模块之间通过IoC容器进行联系，那么对写代码就很有启发了，比如在项目中要对接多个短信服务商，那么每一个短信服务商实际上就是一个Plugin，那么给每一个服务商写一个`EnableXXX`注解，让Spring自动配置到IoC容器中，使用方也只需要从IoC中获取，也是一种不错的解耦的设计。

## 参考
[Creating Your Own Auto-configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html)
