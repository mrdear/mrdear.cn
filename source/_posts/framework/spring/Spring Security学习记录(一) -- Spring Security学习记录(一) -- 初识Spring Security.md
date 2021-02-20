---
title: Spring Security学习记录(一) -- 初识Spring Security
subtitle: Spring Security学习记录(一) -- 初识Spring Security
cover: http://imgblog.mrdear.cn/springsecurity.png
author: 
  nick: 屈定
tags:
  - Spring Security
categories: Spring系列专题
urlname: framework-spring-security1
date: 2017-06-19 14:08:25 
updated: 2017-06-19 14:08:25 
---

###  Spring Security是什么?
Spring Security是一套认证授权框架,支持认证模式如`HTTP BASIC 认证头 (基于 IETF RFC-based 标准)`,`HTTP Digest 认证头 ( IETF RFC-based 标准)`,`Form-based authentication (用于简单的用户界面)`,`OpenID 认证`等,Spring Security使得当前系统可以快速集成这些验证机制亦或是实现自己的一套验证机制.

### 使用Spring Security
Spring Security3之后提供了Java Config的配置方式,但是我觉得xml方式比较容易理解其整体结构,所以本文都是基于xml配置的,在github上该项目会提供Java Config方式作为对比.

#### pom依赖
```java
   <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.4.RELEASE</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
```
由于使用了Spring Boot,所以需要使用`@EnableWebSecurity`注解启用Spring Security,并指明其配置文件为classpath下的`spring-security.xml`
```java
@Configuration
@EnableWebSecurity
@ImportResource(locations = "classpath:spring-security.xml")
public class SecurityConfig {
}
```

#### xml配置
在`spring-security.xml`中引入官方提供的命名空间,然后简单配置下,该配置大概意思是对所有请求的url拦截,必须有User权限的用户才能访问.
```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:security="http://www.springframework.org/schema/security"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
		http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
		http://www.springframework.org/schema/security
		http://www.springframework.org/schema/security/spring-security.xsd">
	
	<security:http >
        <security:intercept-url pattern="/**" access="hasRole('ROLE_USER')"/>
        <security:form-login/>
        <security:http-basic/>
        <security:logout/>
    </security:http>

    <security:authentication-manager>
        <security:authentication-provider>
            <security:user-service>
                <security:user name="user" password="123456" authorities="ROLE_USER"/>
                <security:user name="admin" password="123456" authorities="ROLE_USER, ROLE_ADMIN"/>
            </security:user-service>
        </security:authentication-provider>
    </security:authentication-manager>

</beans>
```
#### 访问测试
该页面为Spring Security自动生成的登录页面,当我们访问任何连接都会被重定向到该登录页面,输入`user:123456`登录后才能有权限访问.
![](http://imgblog.mrdear.cn/1497854910.png?imageMogr2/thumbnail/!70p)

#### 分析
上述是一个简单的Demo,分析则是从这个Demo深入浅出.
**1.Spring Security是如何拦截请求的?**
传统的xml配置都会在web.xml里面配置如下过滤器.
```xml
   <filter>
      <filter-name>springSecurityFilterChain</filter-name>
     <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
   </filter>
   <filter-mapping>
      <filter-name>springSecurityFilterChain</filter-name>
      <url-pattern>/*</url-pattern>
   </filter-mapping>
```
可以看出入口点就是该类,该类会从Spring容器中读取名称为`springSecurityFilterChain`的一个Filter实例,从而获取到对应代理的Filter.
```java
	protected Filter initDelegate(WebApplicationContext wac) throws ServletException {
		Filter delegate = wac.getBean(getTargetBeanName(), Filter.class);
		if (isTargetFilterLifecycle()) {
			delegate.init(getFilterConfig());
		}
		return delegate;
	}
```
然后在doFilter方法中调用该委托的filter,也就实现的拦截请求.
```java
	protected void invokeDelegate(
			Filter delegate, ServletRequest request, ServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		delegate.doFilter(request, response, filterChain);
	}
```
**2. Spring Security拦截请求后是如何处理的?**
打断点可以发现`DelegatingFilterProxy`实际上代理的是`FilterChainProxy`这个类,该类中有`	private List<SecurityFilterChain> filterChains;`全局变量,那么`SecurityFilterChain`为何物?
```java
public interface SecurityFilterChain {

	boolean matches(HttpServletRequest request);

	List<Filter> getFilters();
}
```
从源码可以判断SecurityFilterChain是一套规则所对应的Filter链集合.再看源码`getFilters`,该方法会根据规则(也就是配置中的`security:http`标签)获取一个SecurityFilterChain中的一套对应规则的filter链.
```java
	private List<Filter> getFilters(HttpServletRequest request) {
		for (SecurityFilterChain chain : filterChains) {
			if (chain.matches(request)) {
				return chain.getFilters();
			}
		}
		return null;
	}
```
目前为止大概可以总结出执行流程图
![](http://imgblog.mrdear.cn/1521468002.png?imageMogr2/thumbnail/!100p)

那么还有一个问题比较重要,链是如何执行的?Spring Security在`doFilterInternal`方法中创建一个`VirtualFilterChain`类,调用其`doFilter`方法.`VirtualFilterChain`这个类很有意思,该类继承了`FilterChain`类,那么其就拥有了转交请求到指定filter的能力,另外其还拥有一套filter链`List<Filter> additionalFilters;`,那么这个类就控制了整个Spring Security的执行流程,那么它是怎么实现的呢?
开始我以为是一个循环,然而看了源码才发现自己太low了.
```java
        currentPosition++;
		Filter nextFilter = additionalFilters.get(currentPosition - 1);
		nextFilter.doFilter(request, response, this);
```
`currentPosition`与`additionalFilters`都是全局变量,其在调用filter链的时候每次都把自己本身在`doFilter`传值过去,每一个Filter链节点执行完毕后再返回`VirtualFilterChain`的`doFilter`方法,开启下一个节点执行.其结构如下面代码所示:
```java    
interface IA{
    void doSomeThing(IAChain chain);
  }
  static class IAClass implements IA{

    @Override
    public void doSomeThing(IAChain chain) {
      System.out.println("i am IAClass");
      chain.doSomeThing();
    }
  }

  interface IAChain{
    void doSomeThing();
  }

  static class IAChainClass implements IAChain{

    List<IA> IAChains = new ArrayList<IA>();

    public IAChainClass() {
      IAChains.add(new IAClass());
      IAChains.add(new IAClass());
      IAChains.add(new IAClass());
    }

    int position = 0;

    @Override
    public void doSomeThing() {
      if (position == IAChains.size()) {
        System.out.println("end");
        return;
      }
      IA ia = IAChains.get(position++);
      ia.doSomeThing(this);
    }
  }
```
当调用`iaChainClass.doSomeThing()`输出
```java
i am IAClass
i am IAClass
i am IAClass
end
```
- - - - -
调用链的实现还可以使用继承来实现,每次执行前先执行super()方法.

> github地址:  [https://github.com/nl101531/JavaWEB](https://github.com/nl101531/JavaWEB)

ok,下一章分析具体的Filter链中的节点,探究下Spring Security是如何进行用户认证与权限控制的.
