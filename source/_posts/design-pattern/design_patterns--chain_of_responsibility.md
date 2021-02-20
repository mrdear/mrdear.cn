---
title: 设计模式--责任链模式的思考
subtitle: 关于责任链模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计之道.
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-chain-of-responsibility
date: 2018-03-20 11:03:47
updated: 2018-03-20 11:03:50
---
<!-- toc -->
- - - - -
## 标准责任链模式
责任链模式: 客户端发出的请求,客户端本身并不知道被哪一个对象处理,而直接扔给对象链,该请求在对象链中共享,由对象本身决定是否处理. **当请求被处理后该链终止**.本质目的是把客户端请求与接收者解耦,但是解耦的太彻底了,只能让接收者一个个来看看是不是自己该处理的请求.
标准的责任链模式**一个请求只被一个对象处理**,一旦处理成功后则链终止,请求不再被继续传递.标准的责任链模式并不是很通用,这种一对一模式大多场景可以用策略模式来代替,只有在客户端并不清楚具体的执行者是哪个对象的时候,责任链才比较适合.
举个例子:你想在天朝办理一个证,但是你不知道去哪比较好,因此你的选择就是一条链路,先去A局,A局让你去B局,B局让你去C局等等,直到解决你的问题,当然也存在白跑一趟的结果.这也是标准责任链的缺点,产生了太多没必要的调用.标准的责任链实际上应用场景并不是很多,而常使用的是升级版的功能链.

## 功能链
功能链是责任链的演变,结构上并没有实质的变化,只是每一个节点都可以处理请求,处理完转向下一个,也就是每一个请求都经历全部的链.这种应用场景就比较多了,比如我要办一件事,先去A再去B最后去C,这个例子还有点说明ABC三者的关系,取决于构造链时的顺序,另外每一步没处理好可以自由的选择退出链.
文字说的不是很理解,下面举几个实际中的代码实例.

### Java中Filter链
对于Filter,其是由`FilterChain`来进行链的组合调用,请求的request与返回response实际上是共享的上下文信息,每一个处理的Filter都可以查看与修改.
```java
public interface FilterChain {
    public void doFilter(ServletRequest request, ServletResponse response)
            throws IOException, ServletException;
}
```
在Tomcat中实现类为`org.apache.catalina.core.ApplicationFilterChain`,其结构如下图:
![](http://imgblog.mrdear.cn/1521466345.png?imageMogr2/thumbnail/!100p)
其中数组filters就是所谓的filter链,利用pos(当前执行到的位置)与n(filter链长度)来进行链的调用.
那么怎么让链节点选择继续执行还是停止执行呢?答案的`Filter`的`doFilter`方法,该方法把责任链作为参数`FilterChain`一直传递下去,继续就调用chain的`doFilter`方法,不继续则不调用.

```java
 void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException;
```

### Spring Security中拦截链
Spring Security中的链实际上是由`SecurityFilterChain`接口所定义,其很简单的就是暴露出一个list的链.其中`matches`判断请求是否是这条链来处理.
```java
public interface SecurityFilterChain {

    boolean matches(HttpServletRequest request);

    List<Filter> getFilters();
}
```
在其入口处类`org.springframework.security.web.FilterChainProxy`中包含着多条链.
```java
private List<SecurityFilterChain> filterChains;
```
每一个链处理的是一类请求.Spring Security使用简单的for循环判断定位到具体执行的链.
```java
  private List<Filter> getFilters(HttpServletRequest request)  {
        for (SecurityFilterChain chain : filterChains) {
            if (chain.matches(request)) {
                return chain.getFilters();
            }
        }
        return null;
    }
```
那么这个结构因为这个设计模式就很清晰了(这也是熟悉了设计模式之后的优势,看源码可以有一种全局把控感)
![](http://imgblog.mrdear.cn/1521468002.png?imageMogr2/thumbnail/!100p)

还有一个问题,链是如何自由执行的?
这一点与Java Filter一模一样,Spring Security实现了一个`org.springframework.security.web.FilterChainProxy.VirtualFilterChain`类,该类同样实现了`FilterChain`接口,里面的调用逻辑也与tomcat方式一致.具体就不讨论了.

另外Spring Security也提供了一种数据共享的方式,利用`ThreadLocal`保证线程安全,达到共享数据的目的.另外这里的`SecurityContextHolderStrategy`是策略模式的一种应用,值得一看.
```java
final class ThreadLocalSecurityContextHolderStrategy implements
		SecurityContextHolderStrategy {
    		
	private static final ThreadLocal<SecurityContext> contextHolder = new ThreadLocal<SecurityContext>();

	public void clearContext() {
		contextHolder.remove();
	}

	public SecurityContext getContext() {
		SecurityContext ctx = contextHolder.get();

		if (ctx == null) {
			ctx = createEmptyContext();
			contextHolder.set(ctx);
		}

		return ctx;
	}
	public void setContext(SecurityContext context) {
		Assert.notNull(context, "Only non-null SecurityContext instances are permitted");
		contextHolder.set(context);
	}

	public SecurityContext createEmptyContext() {
		return new SecurityContextImpl();
	}
}

```
### Mybatis中插件链
Mybatis中插件使用的是类似责任链的一种模式,当然也可以称之为责任链模式,毕竟思想都是类似的.其中插件是通过`Interceptor`接口实现的,其中`plugin`方法就是为目标对象套上该链的一个节点.
```java
public interface Interceptor {

  Object intercept(Invocation invocation) throws Throwable;

  Object plugin(Object target);

  void setProperties(Properties properties);
}
```
那么如何构造这个链?在`InterceptorChain`中有如下方法,`InterceptorChain`是在构造配置时组装好的,燃后对目标使用`pluginAll`方法,构造完整链.
```java
public class InterceptorChain {
  private final List<Interceptor> interceptors = new ArrayList<Interceptor>();
  public Object pluginAll(Object target) {
    for (Interceptor interceptor : interceptors) {
      target = interceptor.plugin(target);
    }
    return target;
  }
...
}
```
其中`plugin`官方推荐`Plugin.wrap(target, this)`方法,该方法本质上是用代理模式嵌套住目标类
```java

  public static Object wrap(Object target, Interceptor interceptor) {
    Map<Class<?>, Set<Method>> signatureMap = getSignatureMap(interceptor);
    Class<?> type = target.getClass();
    Class<?>[] interfaces = getAllInterfaces(type, signatureMap);
    if (interfaces.length > 0) {
      return Proxy.newProxyInstance(
          type.getClassLoader(),
          interfaces,
          new Plugin(target, interceptor, signatureMap));
    }
    return target;
  }
```
那么这种构造出的链大概如下面这种嵌套结构,这种链可以说是彻底的功能链,其一旦组装好就无法变化了.当然这种也适合Mybatis这种从配置中就定死了执行链.
![](http://imgblog.mrdear.cn/1521471003.png?imageMogr2/thumbnail/!70p)

### 业务开发中可以常用到的链
在业务开发中常常能遇到这类需求,比如退款操作,退款后可以恢复商品库存,恢复活动库存,退掉用户的优惠券,退掉用户的活动资格等等,该一系列的操作就是一条线性链,那么就可以利用责任链的思想来完成在这样的需求.
先提取出一个公共接口,链节点实现该接口,完成具体的退款操作
```java
public interface RegainAfterRefundOrder {
  /**
   * 退回操作
   * @param bo 该订单,可能是子订单,也可能是主订单,自行判断
   * @param operator 操作人
   * @return true成功
   */
  boolean regain(BizOrderDO bo, Long operator);
}
```
接下来是链的统一管理,也就是需要`Chain`这个类来管理,可以按照下面的实现,其调用链只是简单的在`applyAllPlugin`循环调用,该过程可以按照Spring Security等方式实现更加灵活的调用.
可以根据需求设计为一旦创建就不可改变的类,包括类中的`interceptors`,这样使得代码更加健壮.
```java
@Component
public class RefundOrderAndRegainChain {

  private final List<RegainAfterRefundOrder> interceptors = new ArrayList<>();

  public void applyAllPlugin(BizOrderDO bo, Long operator) {
    for (RegainAfterRefundOrder interceptor : interceptors) {
      interceptor.regain(bo, operator);
    }
  }

  public void addInterceptor(RegainAfterRefundOrder interceptor) {
    interceptors.add(interceptor);
  }

  public List<RegainAfterRefundOrder> getInterceptors() {
    return Collections.unmodifiableList(interceptors);
  }
}
```
最后是借助IOC实现链的组装,假设有`RegainCoupon`,`RegainInventoryCount`,`RegainInvitationCodeWithDraw`等RegainAfterRefundOrder的实现类,依次在Spring的Configuration类中实现注入,并构造出需要的`RefundOrderAndRegainChain`.最后再业务需要的地方直接注入该Chain即可.对于这种逻辑实现了解耦与灵活的组合.
```java
@Configuration
public class RefundOrderAndRegainConfig {

  @Bean
  public RefundOrderAndRegainChain paidToRefund(
      RegainInventoryCount regainInventoryCount,
      RegainCoupon regainCoupon,
      RegainPromotionRegistered regainPromotionRegistered,
      RegainInvitationCodeWithDraw regainInvitationCode) {
    RefundOrderAndRegainChain chain = new RefundOrderAndRegainChain();
    chain.addInterceptor(regainInventoryCount);
    chain.addInterceptor(regainPromotionRegistered);
    chain.addInterceptor(regainCoupon);
    chain.addInterceptor(regainInvitationCode);
    return chain;
  }

}
```

## 责任链模式的本质
1. 让请求者不关心具体接收者是谁,只需要得到自己的具体结果
2. 在一个请求对应多个接收者情况下(Spring Security这种),接收者之间可以自由组合,灵活性很高
3. 新增接收者处理也只需要增加链中的一个节点,不需要改动太多.