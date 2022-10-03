---
title: Spring MVC--参数解析与方法执行
subtitle: 关于Spring MVC如何把请求参数与相应的方法参数映射起来的分析.
cover: http://res.mrdear.cn/springmvc.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-mvc-params
date: 2018-04-18 06:04:46
updated: 2018-04-18 06:04:46
---
承接上文,Spring MVC通过`HandlerMapping`定位到了具体的`HandlerExecutionChain`,也就是具体要执行的方法.本篇详细阐述Spring MVC执行具体方法的流程.

## HandlerAdapter

`HandlerAdapter`用来适配`HandlerExecutionChain`的一个接口,从名称来看这里是**适配器模式**,适配器模式的本质在于**包装转换**,对于`HandlerExecutionChain`中不同的Handler提供适配功能,并且提供统一的调用方法,该接口主要有以下方法:
```java
public interface HandlerAdapter {
  /**
   * 判断是否支持当前的handler适配
   */
	boolean supports(Object handler);
  /**
   * 具体的处理适配
   */
	ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception;
    .....
}
```
在`DispatcherServlet`中定位到具体的`HandlerAdapter`是类似`HandlerMappings`的处理,直接循环,判断是否支持处理,支持则返回,这类似一种标准责任链模式,查找出链中能够处理该事件的第一个节点类.
```java
protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
  for (HandlerAdapter ha : this.handlerAdapters) {
    // 判断是否支持,支持则返回
    if (ha.supports(handler)) {
      return ha;
    }
  }
  throw new ServletException("No adapter for handler [" + handler +
      "]: The DispatcherServlet configuration needs to include a HandlerAdapter that supports this handler");
}
```
`HandlerAdapter`的继承体系如下所示:
![](http://res.mrdear.cn/1523704257.png)
1. `SimpleControllerHandlerAdapter`处理实现了`Controller`接口的handler.
2. `SimpleServletHandlerAdapter`处理实现了`Servlet`接口的handler.
3. `HttpRequestHandlerAdapter`处理实现了`HttpRequestHandler`接口的handler.静态资源映射就是使用该Adapter进行处理.
4. `AbstractHandlerMethodAdapter`处理`HandlerMethod`的子类,也就是我们的业务方法,也是本次分析的重点.

### 模板类AbstractHandlerMethodAdapter
该模板类比较简单,主要声明了所支持处理的类型,然后把请求转到`handleInternal`方法中.
```java
	public final boolean supports(Object handler) {
		return (handler instanceof HandlerMethod && supportsInternal((HandlerMethod) handler));
	}
    // 把请求转到具体的子类
	protected abstract ModelAndView handleInternal(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception;
```

#### 实现类RequestMappingHandlerAdapter
`RequestMappingHandlerAdapter`在作为实现类,主要是负责调用逻辑,如下所示,主要的调用逻辑在`invokeHandlerMethod`方法中.
```java
protected ModelAndView handleInternal(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {
    ... 
    // 调用invokeHandlerMethod方法拿到对应的结果
    mav = invokeHandlerMethod(request, response, handlerMethod);
    ...
    return mav;
	}
```
`invokeHandlerMethod`方法,顾名思义是负责调用的实现,其会把`HandlerMethod`方法封装到`ServletInvocableHandlerMethod`中,然后准备上下文环境,比如参数解析器`HandlerMethodArgumentResolver`,参数转换器`DataBinder`等信息,一切准备好了之后完成调用,在对结果进行解析包装.
```java
protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {

		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		try {
      // 参数转换以及绑定类工厂
      WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
      // 结果转换生成工厂
	ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);
      // 包装要执行的方法HandlerMethod
      ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
      // 加入参数解析器
      invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
      // 加入返回值解析器
      invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
      // 加入转换工厂
      invocableMethod.setDataBinderFactory(binderFactory);
      // 用户获取方法参数名的service
			invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);
      .....
      // 调用方法
			invocableMethod.invokeAndHandle(webRequest, mavContainer);
			if (asyncManager.isConcurrentHandlingStarted()) {
				return null;
			}
      // 取出结果并进行封装
			return getModelAndView(mavContainer, modelFactory, webRequest);
		}
		finally {
			webRequest.requestCompleted();
		}
	}
```
上述流程可以确定以下几点:
1. 参数解析依赖`HandlerMethodArgumentResolver`
2. 返回值解析依赖`HandlerMethodReturnValueHandler`
3. 参数转换与绑定(针对Bean)依赖`WebDataBinderFactory`

### 参数如何解析?
在`org.springframework.web.method.support.InvocableHandlerMethod#getMethodArgumentValues`中定义了参数的解析流程.
```java
private Object[] getMethodArgumentValues(NativeWebRequest request, ModelAndViewContainer mavContainer,
  Object...providedArgs) throws Exception {
  // 获取要执行的方法参数封装
  MethodParameter[] parameters = getMethodParameters();
  Object[] args = new Object[parameters.length];
  // 循环解析参数
  for (int i = 0; i < parameters.length; i++) {
    MethodParameter parameter = parameters[i];
    parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);
    // 优先使用方法传来的参数
    args[i] = resolveProvidedArgument(parameter, providedArgs);
    if (args[i] != null) {
      continue;
    }
    // 使用参数解析器去解析参数
    if (this.argumentResolvers.supportsParameter(parameter)) {
      try {
        args[i] = this.argumentResolvers.resolveArgument(
          parameter, mavContainer, request, this.dataBinderFactory);
        continue;
      } catch (Exception ex) {
        throw ex;
      }
    }
    ...
  }
  return args;
}
```
其中`HandlerMethodArgumentResolver`是负责参数解析的入口,其本身是组合设计模式中的`Component`接口类,`HandlerMethodArgumentResolverComposite`是组合模式中的`Composite`树枝节点类.而众多解析方法则是`Leaf`叶子类,组合模式的本质是为了**组合多个过多的节点,统一叶子节点和组合节点**,给客户端提供统一的访问形式在使用时不需要做区分,通过`Composite`类把众多解析操作组合一起.

`HandlerMethodArgumentResolver`接口定义如下,其中`MethodParameter`是对用户业务方法参数的封装,比如参数类型,所属Bean,修饰的`Annotation`等.
```java
public interface HandlerMethodArgumentResolver {
  /**
   * 是否支持该参数的解析.
   */
	boolean supportsParameter(MethodParameter parameter);
	/**
   * 解析操作
   */
	Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception;
}
```
其中`AbstractNamedValueMethodArgumentResolver`作为其中之一的模板类定义了那些需要根据名称解析参数方式的一些模板,比如`@RequestParam`,`@RequestHeader`等注解,大概流程如下,把具体的获取过程利用抽象方法`resolveName()`延迟到了子类实现,让子类专注于从相应区域获取到对应的参数,拿到参数后使用`WebDataBinder`对参数进行类型转换,下面是该模板类的解析流程:
```java
public final Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
    ...
    // 获取要获取的参数名称
		Object resolvedName = resolveStringValue(namedValueInfo.name);
    // 根据参数名从request中取出结果,这一步延迟到子类中实现,降低子类的复杂度.
		Object arg = resolveName(resolvedName.toString(), nestedParameter, webRequest);
    ...
    // 使用WebDataBinder转换到需要的类型
		if (binderFactory != null) {
			WebDataBinder binder = binderFactory.createBinder(webRequest, null, namedValueInfo.name);
			try {
				arg = binder.convertIfNecessary(arg, parameter.getParameterType(), parameter);
			}
			...
		}
		handleResolvedValue(arg, namedValueInfo.name, parameter, mavContainer, webRequest);
		return arg;
	}
```
这个是参数的大概解析流程,同理从playload中解析的大概也是如此设计,最底层的子类只负责从相应区域获取参数,上层的模板类负责参数的统一处理转换操作.

### 参数如何类型转换以及绑定?
在一般的写法中,经常会使用一个对象来接收参数,Spring MVC会自动把参数设置到该参数对象对应的属性上,这个是怎么实现的呢?答案是`ModelAttributeMethodProcessor`参数解析器,解析流程如下:
```java
public final Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
    // 获取参数名
    String name = ModelFactory.getNameForParameter(parameter);
    // 获取该参数实例,该方法实质上使用无参构造函数创建实例
    Object attribute = (mavContainer.containsAttribute(name) ? mavContainer.getModel().get(name) :
            createAttribute(name, parameter, binderFactory, webRequest));
    ...
    // 创建绑定
    WebDataBinder binder = binderFactory.createBinder(webRequest, attribute, name);
    if (binder.getTarget() != null) {
        if (!mavContainer.isBindingDisabled(name)) {
        // 按照名称进行参数绑定
        bindRequestParameters(binder, webRequest);
      }
      // 如果有必要则进行验证
        validateIfApplicable(binder, parameter);
        if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
            throw new BindException(binder.getBindingResult());
        }
    }
    // 转换为参数需要的类型
    return binder.convertIfNecessary(binder.getTarget(), parameter.getParameterType(), parameter);
}
```
其中参数的绑定和转换都依赖`WebDataBinder`这个类,相比`DataBinder`该类额外提供了从request中取出参数的能力,其绑定功能依赖`BeanWrapper`,转换功能依赖`ConversionService`.
![图片来自网络](http://res.mrdear.cn/1523722430.png)

`ConversionService`是Spring3引进的类型转换系统,在Spring中想添加一个转换器有如下几种做法
1. 实现`interface Converter<S, T>`接口,负责把S转换为T
2. 实现`interface ConverterFactory<S, R>`接口,其负责把一类S转换为另一类R对象,与上面不同的是该方法是一个工厂类,其负责生产一类转换,比如String到Number,String到Integer等.
3. 实现`GenericConverter`接口,是类型转换中最复杂最强大的存在,可以实现根据上下文信息转换,支持一个源或者多个源到目标的转换.

#### 自定义转换器
举个例子,实现字符到枚举类的转换:
```java
public class StringToEnumConvert implements ConverterFactory<String,Enum> {
  @Override
  @SuppressWarnings("unchecked")
  public <T extends Enum> Converter<String, T> getConverter(Class<T> aClass) {
    return s -> (T)Enum.valueOf(aClass, s.trim());
  }
}
```
然后再自定义配置中加入该转换器,参数解析是对于字符串到枚举类会自动利用该转换器进行转换处理.
```java
@Configuration
public class MvcConfig extends WebMvcConfigurerAdapter {

  @Override
  public void addFormatters(FormatterRegistry registry) {
    //添加字符串到枚举类的转换
    registry.addConverterFactory(new StringToEnumConvert());
  }
}
```

### 方法如何执行?
解决了参数后直接利用反射执行.
```java
	protected Object doInvoke(Object... args) throws Exception {
		ReflectionUtils.makeAccessible(getBridgedMethod());
		try {
                // 获取用户方法执行
			return getBridgedMethod().invoke(getBean(), args);
		}
        ....
	}
```

## 参考
[https://www.jianshu.com/p/d64800baaa04](https://www.jianshu.com/p/d64800baaa04)
