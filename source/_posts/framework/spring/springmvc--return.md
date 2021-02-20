---
title: Spring MVC--返回值的解析
subtitle: 关于Spring MVC是如何决定返回形式的分析
cover: http://imgblog.mrdear.cn/springmvc.png
author: 
  nick: 屈定
tags:
  - Spring MVC
categories: Spring系列专题
urlname: framework-springmvc-return
date: 2018-04-23 08:04:43
updated: 2018-04-23 08:04:39
---
承接上文调用`HandlerMethod`之后会获取到对应的返回值,对返回值的解析使用的是`HandlerMethodReturnValueHandler`接口,该接口的设计与参数解析器`HandlerMethodArgumentResolver`一模一样,都是组合设计模式,使用树枝节点来组合所有的解析器,下面开始分析.

## HandlerMethodReturnValueHandler
`HandlerMethodReturnValueHandler`中有两个方法,一个是判断是否支持,一个是处理.
```java
public interface HandlerMethodReturnValueHandler {

  /**
   * 是否支持当前类型,一般根据类型本身或是注解来判断
   */
	boolean supportsReturnType(MethodParameter returnType);

  /**
   * 处理返回结果,返回结果主要存放到ModelAndViewContainer中
   */
	void handleReturnValue(Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception;

}
```
`HandlerMethodReturnValueHandler`的继承结构大概如下,由于子类众多,所以只列出了几个:
![](http://imgblog.mrdear.cn/1523765027.png?imageMogr2/thumbnail/!100p)

从功能上来分大概会有两类,一种是直接写回数据不需要经过视图解析器`ViewResolver`,其表现是继承了`AbstractMessageConverterMethodProcessor`抽象模板类,一种则是封装到`ModelAndViewContainer`中,转交给视图解析器后再返回,这里的分析重点关注前者.

### 不经过ViewResolver的返回
举个例子开发中常用`@ResponseBody`来返回json信息,其对应的处理器为`RequestResponseBodyMethodProcessor`,该处理器继承了`AbstractMessageConverterMethodProcessor`因此拥有消息转换的能力,该处理不需要经过视图解析器,因此这里是直接利用`MessageConverter`写回数据.
```java
public class RequestResponseBodyMethodProcessor extends AbstractMessageConverterMethodProcessor {
  /**
   * 根据返回值上的注解决定是否支持解析
   */
  @Override
	public boolean supportsReturnType(MethodParameter returnType) {
		return (AnnotatedElementUtils.hasAnnotation(returnType.getContainingClass(), ResponseBody.class) ||
				returnType.hasMethodAnnotation(ResponseBody.class));
  }
  

	@Override
	public void handleReturnValue(Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest)
			throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {
    // 直接写回到Response中,因此这里要设置为已处理过,保证总流程中数据解析器不再解析
		mavContainer.setRequestHandled(true);
		ServletServerHttpRequest inputMessage = createInputMessage(webRequest);
		ServletServerHttpResponse outputMessage = createOutputMessage(webRequest);

		// 使用MessageConverter写回,这个稍后分析
		writeWithMessageConverters(returnValue, returnType, inputMessage, outputMessage);
	}
}
```
最后解析会调用模板类中的`writeWithMessageConverters`,该方法主要是选择最适合的转换器,利用`HttpMessageConverter`进行转换输出.
```java
protected <T> void writeWithMessageConverters(T value, MethodParameter returnType,
			ServletServerHttpRequest inputMessage, ServletServerHttpResponse outputMessage)
			throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {
    ...
    // 获取到请求支持的MediaType类型,以及可以产生的MediaType类型
		HttpServletRequest request = inputMessage.getServletRequest();
		List<MediaType> requestedMediaTypes = getAcceptableMediaTypes(request);
		List<MediaType> producibleMediaTypes = getProducibleMediaTypes(request, valueType, declaredType);

    // 选出最合适的类型
		Set<MediaType> compatibleMediaTypes = new LinkedHashSet<MediaType>();
		for (MediaType requestedType : requestedMediaTypes) {
			for (MediaType producibleType : producibleMediaTypes) {
				if (requestedType.isCompatibleWith(producibleType)) {
					compatibleMediaTypes.add(getMostSpecificMediaType(requestedType, producibleType));
				}
			}
		}
    ...
    // 排序然后循环,目的是使用最佳的类型来处理
		List<MediaType> mediaTypes = new ArrayList<MediaType>(compatibleMediaTypes);
		MediaType.sortBySpecificityAndQuality(mediaTypes);

		MediaType selectedMediaType = null;
		for (MediaType mediaType : mediaTypes) {
			if (mediaType.isConcrete()) {
				selectedMediaType = mediaType;
				break;
			}
      ...
		}
    // 对HttpMessageConverter做一个循环,直到选出第一个支持的Converter为止
		if (selectedMediaType != null) {
			selectedMediaType = selectedMediaType.removeQualityValue();
			for (HttpMessageConverter<?> messageConverter : this.messageConverters) {
				if (messageConverter instanceof GenericHttpMessageConverter) {
					if (((GenericHttpMessageConverter) messageConverter).canWrite(
							declaredType, valueType, selectedMediaType)) {
						outputValue = (T) getAdvice().beforeBodyWrite(outputValue, returnType, selectedMediaType,
								(Class<? extends HttpMessageConverter<?>>) messageConverter.getClass(),
								inputMessage, outputMessage);
						if (outputValue != null) {
							addContentDispositionHeader(inputMessage, outputMessage);
							((GenericHttpMessageConverter) messageConverter).write(
									outputValue, declaredType, selectedMediaType, outputMessage);
						}
						return;
					}
				}
        ...
			}
		}

		if (outputValue != null) {
			throw new HttpMediaTypeNotAcceptableException(this.allSupportedMediaTypes);
		}
	}
```
这其中的转换操作使用的是`HttpMessageConverter`,该类是一个双向的操作,其既可以支持读取,也可以支持写回,因此在Spring MVC中我们可以直接使用`@RequestBody`接收json字符串格式的Bean,写回主要使用的是其所提供的`write()`功能.Spring MVC默认提供了众多解析器包括如下这些,想要自定义解析器的话可以任意参考其中一个即可.
1. MappingJackson2HttpMessageConverter
2. GsonHttpMessageConverter
3. ByteArrayHttpMessageConverter
4. ObjectToStringHttpMessageConverter
5. ProtobufHttpMessageConverter
6. ResourceHttpMessageConverter
7. StringHttpMessageConverter
8. AllEncompassingFormHttpMessageConverter

### 经过ViewResolver的返回
经过视图解析器的返回处理就很简单了,主要是把视图名还有参数信息设置到`ModelAndViewContainer`容器中,便于视图解析器使用
以`ViewNameMethodReturnValueHandler`为例
```java
public void handleReturnValue(Object returnValue, MethodParameter returnType,
  ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {

  if (returnValue instanceof CharSequence) {
    String viewName = returnValue.toString();
    // 设置使用视图名
    mavContainer.setViewName(viewName);
    // 判断是否是重定向请求
    if (isRedirectViewName(viewName)) {
      mavContainer.setRedirectModelScenario(true);
    }
  } else if (returnValue != null) {
    // should not happen
    throw new UnsupportedOperationException("Unexpected return type: " +
      returnType.getParameterType().getName() + " in method: " + returnType.getMethod());
  }
}
```
然后接着转交给视图解析器`ViewResolver`解析,主要逻辑会在`org.springframework.web.servlet.DispatcherServlet#render`中,Spring MVC会从中选择对应的视图解析器,比如thymeleaf就对应`ThymeleafViewResolver`,jsp则对应`JstlViewResolver`,具体不在深入.到此算是Spring MVC完整的流程结束.
