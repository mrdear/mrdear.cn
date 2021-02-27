---
title: Spring MVC--异常处理
subtitle: 关于Spring MVC是如何处理异常的分析
cover: http://imgblog.mrdear.cn/springmvc.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-springmvc-exception
date: 2018-04-23 09:04:31
updated: 2018-04-23 09:04:37
---
承接上文,该篇说一下Spring MVC是如何处理解析过程中的异常事件,异常抛出首先肯定需要捕获,然后在对应的处理器中处理.本文围绕着如何捕获以及如何处理来探讨.

## 如何捕获异常?
在`DispatcherServlet`中的处理分发方法中,在处理之前便定义了一个异常`Exception dispatchException`,并在catch中把处理中的异常赋给该变量,最后再`processDispatchResult()`方法中处理异常.这是第一个问题**如何捕获异常**的答案.
```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
   ....
    ModelAndView mv = null;
    // 定义异常
    Exception dispatchException = null;
    try {
      .....
      主要的处理逻辑
    catch (Exception ex) {
      // 对于这之中的异常复制
      dispatchException = ex;
    }
    catch (Throwable err) {
      dispatchException = new NestedServletException("Handler dispatch failed", err);
    }
    // 处理结果时顺便处理异常
    processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
    ....
}
```

## 如何处理异常?
异常的处理主要在`org.springframework.web.servlet.DispatcherServlet#processHandlerException`方法中,异常本身会转换成错误信息返回或者定向到错误的页面.在这个方法中会在`List<HandlerExceptionResolver> handlerExceptionResolvers`先选择最适合的异常解析器,和之前的设计相同,这是一种标准的**责任链模式**使用形式,异常会在这个链中传递直到其被处理为止,用户自定义异常处理器的优先级会比较高,也就是排在责任链的前面.
```java
protected ModelAndView processHandlerException(HttpServletRequest request, HttpServletResponse response,
  Object handler, Exception ex) throws Exception {
  ModelAndView exMv = null;
  // 选择合适的异常解析器
  for (HandlerExceptionResolver handlerExceptionResolver: this.handlerExceptionResolvers) {
    exMv = handlerExceptionResolver.resolveException(request, response, handler, ex);
    if (exMv != null) {
      break;
    }
  }
  if (exMv != null) {
    if (exMv.isEmpty()) {
      request.setAttribute(EXCEPTION_ATTRIBUTE, ex);
      return null;
    }
    // 指向错误页面的话设置页面名
    if (!exMv.hasView()) {
      exMv.setViewName(getDefaultViewName(request));
    }
    WebUtils.exposeErrorRequestAttributes(request, ex, getServletName());
    return exMv;
  }
  throw ex;
}
```
`HandlerExceptionResolver`是组合模式+模板方法设计模式,继承结构图如下:
![](http://imgblog.mrdear.cn/1523791699.png?imageMogr2/thumbnail/!100p)

其中用的最多的是`ExceptionHandlerExceptionResolver`,也就是使用`@ControllerAdvice`与`@ExceptionHandler`所定义的异常,比如下面定义的全局异常:
```java
@ControllerAdvice
public class ExceptionController {
  @ExceptionHandler(Exception.class)
  public JSONObject exception(Exception e) {
    final JSONObject jsonObject = new JSONObject();
    jsonObject.put("message", e.getMessage());
    jsonObject.put("status", 0);
    return jsonObject;
  }
}
```
转换到内存中对应的是
![](http://imgblog.mrdear.cn/1523792438.png?imageMogr2/thumbnail/!100p)

`ExceptionHandlerExceptionResolver`拥有参数解析器,返回值解析器,以及信息转换器这些组件给其提供了强大的异常捕获能力.其处理流程为定位到具体要执行的异常处理方法,封装成`ServletInvocableHandlerMethod`,然后执行拿到对应的`returnValue`,接着使用返回值解析器解析,根据结果判断是否需要写回modelView,这里的与业务方法的调用解析流程并没有很大的区别.
![](http://imgblog.mrdear.cn/1523792535.png?imageMogr2/thumbnail/!100p)

到此异常处理完毕,很多细节都没有仔细的研究,时间原因,精力原因,也有一方面觉得不是很有必要,了解了这个过程后遇到的问题也基本上很容易定位了.

## 总结
总体感觉下来Spring MVC并不是一款对于性能追求极致的框架,而是一款对扩展性追求极致的框架,其提供了太多的hack入口,让你可以定制自己的解析逻辑或者扩展现有的策略.
而整个设计流程给我最大的感触就是变与不变的分离,就像圆规画圆,第一步永远是固定圆心,然后另一支轴可以任意扩展,无论是`DispatcherServlet`还是各种`AbstractXXXXX`的设计都是如此,不变的定义在上层,变化的转换成另一个接口沉淀到其他层,尽量降低其他层的复杂度,从而在整个系统上提供了很高的扩展性,希望对你有启发.
最后如有错误还请指出,以免误人子弟.

