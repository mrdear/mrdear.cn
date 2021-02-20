---
title: Spring Security学习记录(二) -- Spring Security的Filter
subtitle: Spring Security学习记录(二) -- Spring Security的Filter
cover: http://imgblog.mrdear.cn/springsecurity.png
author: 
  nick: 屈定
tags:
  -  Spring Security    
categories: Spring系列专题
urlname: framework-spring-security2
date: 2017-06-22 22:03:37
updated: 2017-06-22 22:03:37
---
上一篇学习了Spring Security是如何拦截请求,并把请求转向到Filter链的,该篇就主要学习下这些Filter链的节点的作用.
- - - - -
下面是之前配置的内容,本文也是对这些内容 的执行分析.
```xml
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
```
### 1.Filter链的由来
由上文可知每一个`security:http`标签实际上对应的是一个`SecurityFilterChain`的类,也就是一条Filter链,可以通过其http属性指明其作用的URL,否则作用域全部的URL,如下配置,该security:http会产生一个对/login下的所有请求Filter链.
```xml
    <security:http pattern="/login/**">
        ******
    </security:http>
```
打个断点可以很清楚的看到该Filter链
![](http://imgblog.mrdear.cn/1498283386.png?imageMogr2/thumbnail/!70p)

### 2.SecurityContextPersistenceFilter
该类在所有的Filter之前,是从`SecurityContextRepository`中取出用户认证信息,默认实现类为`HttpSessionSecurityContextRepository`,其会从Session中取出已认证用户的信息,提高效率,避免每一次请求都要查询用户认证信息.
取出之后会放入`SecurityContextHolder`中,以便其他filter使用,该类使用ThreadLocal存储用户认证信息,保证了线程之间的信息隔离,最后再finally中清除该信息.
可以配置http的`security-context-repository-ref`属性来自己控制获取到已认证用户信息的方式,比如使用redis存储session等.

### 3.WebAsyncManagerIntegrationFilter
提供了对securityContext和WebAsyncManager的集成,其会把SecurityContext设置到异步线程中,使其也能获取到用户上下文认证信息.

### 4.HeaderWriterFilter
其会往该请求的Header中添加相应的信息,在http标签内部使用`security:headers`来控制.

### 5.CsrfFilter
Csrf,跨站请求伪造,了解不是很深,只知道B网站使用A网站的可信Cookie发起请求,从而完成认证,伪造出正当请求.
验证方式是通过客户端传来的token与服务端存储的token进行对比,来判断是否为伪造请求,有兴趣的可以查看源代码研究下.

### 6.LogoutFilter
匹配URL,默认为`/logout`,匹配成功后则用户退出,清除认证信息.

### 7.UsernamePasswordAuthenticationFilter
登录认证过滤器,默认是对`/login`的POST请求进行认证,首先该方法会先调用`attemptAuthentication`尝试认证获取一个`Authentication`的认证对象,然后通过`sessionStrategy.onAuthentication`执行持久化,也就是保存认证信息,转向下一个Filter,最后调用`successfulAuthentication`执行认证后事件.

**attemptAuthentication**
该方法是认证的主要方法,认证是委托配置的`authentication-manager`->`authentication-provider`进行.
比如对于该Demo配置的为如下,则默认使用的manager为`ProviderManager`,使用的provider为`DaoAuthenticationProvider`,userDetailService为`InMemoryUserDetailsManager`也就是从内存中获取用户认证信息,也就是下面xml配置的user与admin信息.
```xml
    <security:authentication-manager>
        <security:authentication-provider>
            <security:user-service>
                <security:user name="user" password="123456" authorities="ROLE_USER"/>
                <security:user name="admin" password="123456" authorities="ROLE_USER, ROLE_ADMIN"/>
            </security:user-service>
        </security:authentication-provider>
    </security:authentication-manager>
```
认证基本流程为`UserDeatilService`根据用户名获取到认证用户的信息,然后通过`UserDetailsChecker.check`对用户进行状态校验,最后通过`additionalAuthenticationChecks`方法对用户进行密码校验成功后完成认证.返回一个认证对象.

都是面向接口编程,所以用户可以很轻松的扩展自己的验证方式.
### 8.DefaultLoginPageGeneratingFilter
当请求为登录请求时,生成简单的登录页面返回

### 9.BasicAuthenticationFilter
Http Basci认证的支持,该认证会把用户名密码使用base64编码后放入header中传输,如下所示,认证成功后会把用户信息放入`SecurityContextHolder`中.
```xml
 * Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```
### 10.RequestCacheAwareFilter
恢复被打断的请求,具体未研究

### 11.SecurityContextHolderAwareRequestFilter
针对Servlet api不同版本做的一些包装

### 12.AnonymousAuthenticationFilter
当`SecurityContextHolder`中认证信息为空,则会创建一个匿名用户存入到`SecurityContextHolder`中

### 13.SessionManagementFilter
与登录认证拦截时作用一样,持久化用户登录信息,可以保存到session中,也可以保存到cookie或者redis中.

### 14.ExceptionTranslationFilter
异常拦截,其处在Filter链后部分,只能拦截其后面的节点并且着重处理`AuthenticationException`与`AccessDeniedException`两个异常.

### 15.FilterSecurityInterceptor
主要是授权验证,方法为`beforeInvocation`,在其中调用
```java
Collection<ConfigAttribute> attributes = this.obtainSecurityMetadataSource()
				.getAttributes(object);
```
获取到所配置资源访问的授权信息,对于上述配置,获取到的则为`hasRole('ROLE_USER')`,然后根据`SecurityContextHolder`中存储的用户信息来决定其是否有权限,没权限则返回403,具体想了解可以关注`HttpConfigurationBuilder.createFilterSecurityInterceptor()`方法,分析其创建流程加载了哪些数据,或者分析`SecurityExpressionOperations`的子类,其是权限鉴定的实现方法.

### 总结
整个认证授权流程如下图所示,图是网上盗的
![](http://imgblog.mrdear.cn/1498318805.png?imageMogr2/thumbnail/!70p)

因为是学习方面,使用的不是很多,如有错误请指出,以防误人子弟.
简单来说,作为用户需要关心的地方是
1. 登录验证`UsernamePasswordAuthenticationFilter`
2. 访问验证`BasicAuthenticationFilter`
3. 权限验证`FilterSecurityInterceptor`
下一篇则讲述利用这三个验证实现JWT验证.

关于这些过滤器更详细的内容可参考博客: [http://www.iteye.com/blogs/subjects/spring_security](http://www.iteye.com/blogs/subjects/spring_security)

> github地址:  [https://github.com/nl101531/JavaWEB](https://github.com/nl101531/JavaWEB)



