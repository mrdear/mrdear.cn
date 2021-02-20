---
title: Spring MVC--所存在的疑惑
subtitle: 最近开始阅读Spring MVC源码,打算解决一些自己的疑惑.
cover: http://imgblog.mrdear.cn/springmvc.png
author: 
  nick: 屈定
tags:
  - Spring MVC
categories: Spring系列专题
urlname: framework-springmvc-framework
date: 2018-04-15 09:04:14
updated: 2018-04-15 09:04:16
---
在之前Mybatis的源码中,笔者学到了不少东西,工作中遇到了Mybatis关于参数解析,TypeHandler映射等相关问题也都是轻而易举的解决,那么作为工作中另一款使用频率极高的框架Spring MVC,源码分析必不可少,这次吸取经验,不死磕功能,只关注大局,以及业务中可能会遇到的一些要点.

## DispatcherServlet简介
Spring MVC是请求驱动设计的框架,其围绕着一个中心处理器`DispatcherServlet`,请求的分配执行返回整个流程都是由`DispatcherServlet`控制.`DispatcherServlet`本质上仍然是一个Servlet,但是其持有`ApplicationContext context`对象,也就是`DispatcherServlet`被赋予了Spring的一切能力.

可以想象`DispatcherServlet`本质上是Servlet,那么他的输入参数自然是request,可以理解为具体的url+params信息集合.拿到这些信息后Spring MVC的做法如下所示(代码省略了许多,保留了主流程):
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
      ....
      // 定位到要执行的方法链包括拦截器
      mappedHandler = getHandler(processedRequest);
      ...
      // 方法执行适配器,包括参数解析转换以及方法调用.
      HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
      ...
      // 调用拦截器的前置处理器
      if (!mappedHandler.applyPreHandle(processedRequest, response)) {
        return;
      }
      ...
      // 调用业务方法
      mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
       ...
      // 调用拦截器的后置处理器
      mappedHandler.applyPostHandle(processedRequest, response, mv);
       ...
      // 结果渲染写回
      processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
    }
```
体系结构图大概如下:
![http://www.cnblogs.com/ylhssn/p/4062757.html](http://imgblog.mrdear.cn/1523684141.png?imageMogr2/thumbnail/!100p)

总体执行流程描述如下:
Spring MVC把执行流程完整的定义在了`DispatcherServlet`中,对于他来说第一步是根据request的url以及`HandlerMapping`来定位到要执行的`HandlerExecutionChain`,这个就是方法的执行链,包括Spring MVC的拦截器以及用户自己定义的业务方法,具体执行时会使用`HandlerAdapter`进行适配,在这个步骤中包括了具体的参数解析,类型转换,然后利用反射调用具体的方法拿到返回值,接着对返回值进行解析,如果返回值是一个页面那么将结果封装为`ModelAndView`,如果不是则世界使用`MessageConvert`进行转换写回,对于页面接下来会给视图解析器`ViewResolver`来处理,最后输出对应的结果.

**有何问题?**
抛去细节来看的话执行结果是一条很清晰的线性结构,先定位到具体方法,然后执行前置拦截器,接着执行自己的方法,执行后置拦截器,最后写回结果.针对上述流程大概会有以下几个问题需要思考:
- 根据url是如何定位到`mappedHandler`,也就是对应的执行方法?
[Spring MVC--请求定位](https://mrdear.cn/posts/framework-springmvc-request.html)
- 用户的业务方法是如何执行的?方法参数是如何获取并转换到所需要的类型?
[Spring MVC--参数解析与方法执行](https://mrdear.cn/posts/framework-spring-mvc-params.html)
- 结果返回视图还是json或者其他类型是由什么来决定?
[Spring MVC--返回值的解析](https://mrdear.cn/posts/framework-springmvc-return.html)
- 线性执行过程中的异常时如何处理?
[Spring MVC--异常处理](https://mrdear.cn/posts/framework-springmvc-exception.html)

如有问题,请指出以免误人子弟
 

