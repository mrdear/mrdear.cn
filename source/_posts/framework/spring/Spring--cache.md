---
title: Spring -- Cache原理
subtitle: 描述Spring中Cache的使用以及对应的处理原理
cover: http://res.mrdear.cn/mrdearblog-springboot.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-cache
date: 2019-09-28 18:09:56
updated: 2020-06-20 21:15:04
---

## 简介
Spring Cache并不是一种缓存的实现方式，而是缓存使用的一种方式，其基于Annotation形式提供缓存存取，过期失效等各种能力，这样设计的理由大概是缓存和业务逻辑本身是没有关系的，不需要耦合到一起，因此使用Annotation修饰方法，使得方法中只需要关心具体的业务逻辑，并不需要去关心缓存逻辑。

Spring Cache相关实现逻辑都在Spring Context的`org.springframework.cache`包中，有兴趣可以直接翻阅源代码学习。

## 使用
首先打开缓存配置，在Spring Boot中使用`@EnableCaching`注解，打开缓存，该注解的作用主要是启用`ProxyCachingConfiguration`配置，用于扫描被注解修饰的需要被缓存的方法。

### 注册缓存管理器
Spring Cache提供的缓存管理主要分为`CacheManager`用于管理多个缓存,以及`Cache`用户具体缓存存放实现，结构如下图所示。
![](http://res.mrdear.cn/1569655100.png?imageMogr2/thumbnail/!50p)

关于`CacheManager`的配置主要有基于Spring Boot的自动配置类`CacheAutoConfiguration`，用户可以自定义`CacheManagerCustomizer`往缓存管理器中实例化具体缓存类，如下图所示，该配置会自动选择缓存的实现，然后在实例化前调用对应的`CacheManagerCustomizer`执行用户业务逻辑。
```java
@Component
public class SimpleCacheCustomizer implements CacheManagerCustomizer<ConcurrentMapCacheManager> {
    @Override
    public void customize(ConcurrentMapCacheManager cacheManager) {
        cacheManager.setCacheNames(Lists.newArrayList("quding","mrdear"));
    }   
}
```

自动配置在我看来相当黑盒，实际开发中可能由于jar间接引用等问题，导致缓存初始化错误，因此比较建议手动配置。Spring有一套缓存实现推荐，基于内存的Caffeine，基于文件Ecache，分布式缓存Redis等等，可以根据自己的业务需求选择实例化对应缓存管理器类。
```java
// 实例化一个基于内存的缓存管理器, 其内部有users，addresses两个Cache对象。
@Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users","addresses");
}

// 实例化一个基于Caffeine的缓存管理器，其内部有users Cache对象。
    @Bean
    public CacheManager hoursCache() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        Caffeine<Object, Object> caffeine = Caffeine.newBuilder()
            .initialCapacity(50)
            .maximumSize(100)
            .expireAfterWrite(1, TimeUnit.HOURS);

        cacheManager.setCaffeine(caffeine);
        cacheManager.setCacheNames(Collections.singletonList("users"));
        return cacheManager;
    }
```
`CacheManager`提供的仅仅是多个同类缓存管理能力，而缓存自身特性则有自身组件来实现，比如`Caffeine`中由` Caffeine.newBuilder()`实现自身缓存初始容量，淘汰策略等特性。

### 使用缓存
Spring Cache提供了四个Annotation方便开发人员使用缓存，而不建议直接访问`CacheManager`自己做定制，具体如下表格所示：

| 注解 | 描述 |
| --- | --- | 
| Cacheable | 存在则从缓存取,不存在则执行方法,结果放入到缓存 |
| CacheEvict | 将方法操作对象缓存删除 |
| CachePut | 无论方法是否存在都会将执行结果放入到缓存中 |
| Caching | 以上三种的组合 | 

以`Cacheable`的使用为例，如下代码所示，该注解实现了缓存id大于1的所有用户实例，其背后原理是什么呢？
```java
    /**
     * 结果放入缓存users中
     * 使用缓存管理器为(bean名) cacheManager
     * 缓存key为 参数id
     * id小于2的不缓存
     */
    @Cacheable(cacheNames = "users", cacheManager = "cacheManager", key = "#id", unless = "#id < 2")
    public User findById(Long id) {
        logger.info("query user={} from db ", id);
        return new User(id);
    }
```

那么到这里，Spring Cache大致工作原理可以猜测出来大概，我们可以简单的理解为下图流程，然后再深入具体分析案例加深理解。
![](http://res.mrdear.cn/uPic/spring-cache-visit.png)

### 实现原理
由上述流程可以得到，Spring Cache主要有CacheManager负责管理类缓存，由CacheInterceptor使用AOP方式来实现缓存，因此实现原理从这两个方面入手。

#### CacheManager
**CacheManager**主要作用是管理缓存，其结构图如下所示，在Cache的设计上Spring使用了组合，适配器等相关模式，大体上可以分为以下几类：
- 缓存实现类：比如ConcurrentMapCacheManager，CaffeineCacheManager等缓存直接实现
- 缓存组合类：比如CompositeCacheManager，其利用组合模式组合多个缓存，比如分布式缓存再套一层本地缓存，就可以用该类实现
- 缓存代理以及装饰类：比如TransactionAwareCacheManagerProxy，TransactionAwareCacheDecorator，其让缓存行为感知到当前事务，在事务行为之后，执行对应缓存逻辑。
![](http://res.mrdear.cn/uPic/V93gDC.png)

**CacheManager**的结构也很好理解，所谓的Manager本质上是一个K-Cache的Map，也就是一个Manager会对应多个缓存，该多个缓存都是由同一个缓存构造器构造而来，所以也可以理解为Manager管理的是具有相同特点的一类缓存，以`CaffeineCacheManager`为例，其数据结构如下：
![](http://res.mrdear.cn/uPic/spring-cache-manager.png "")

#### CacheInterceptor
Spring注册缓存管理器后，需要对指定Annotation注解方法进行拦截并执行缓存逻辑，该套实现方案依赖AOP，关于AOP可以参考我另一篇文章[关于IoC与AOP的一些理解
](https://mrdear.cn/posts/framework-spring-apo-ioc.html)，那么只需要找到AOP对应的`MethodInterceptor`，从该处入手即可了解整个缓存拦截流程。

在使用`@EnableCaching`注解后，Spring便会注册`BeanFactoryCacheOperationSourceAdvisor`解析器，其在Bean实例化后，发现Bean使用Cache相关注解后，便自动创建代理，解析缓存相关操作，便于调用过程中直接进入AOP流程，在Spring Cache中，其`MethodInterceptor`的实现为`org.springframework.cache.interceptor.CacheInterceptor`，流程如下图所示：
- CacheInterceptor：要缓存代理类，执行拦截的入口
- CacheOperationSource：被缓存注解标识的方法，该类自动配置时收集了所有被Cache相关注解标注的方法
- CacheOperation：每一个注解针对的缓存操作，比如CachePut针对CachePutOperation类
![](http://res.mrdear.cn/uPic/spring-cache-interceptor.png "")

其中`CacheInterceptor`拦截后，将调用方法进行封装，转到`CacheAspectSupport#execute()`中，该方法也是整个缓存执行到的核心逻辑。

**清单：CacheAspectSupport#execute()**
```java
	@Nullable
	protected Object execute(CacheOperationInvoker invoker, Object target, Method method, Object[] args) {
		// Check whether aspect is enabled (to cope with cases where the AJ is pulled in automatically)
		if (this.initialized) {
			Class<?> targetClass = getTargetClass(target);
			// 存储所有缓存操作的池子,一个注解可以理解为一次缓存操作
			CacheOperationSource cacheOperationSource = getCacheOperationSource();
			if (cacheOperationSource != null) {
				// 根据 方法 + 类 定位对应的缓存操作
				Collection<CacheOperation> operations = cacheOperationSource.getCacheOperations(method, targetClass);
				if (!CollectionUtils.isEmpty(operations)) {
					// 下一步调用
					return execute(invoker, method,
							new CacheOperationContexts(operations, method, args, target, targetClass));
				}
			}
		}
		return invoker.invoke();
	}
```

方法调用与缓存获取主要实现逻辑如下代码所示，代码中都已经标识好了注释，其中值得关注的是`Cacheable`，`CachePut`操作的区别，`Cacheable`会优先去缓存里面获取，缓存获取到了，且当前没有对应的`CachePut`操作，则不会再次调用方法。`CachePut`则只要存在，就一定会再次调用方法处理。
```java
	@Nullable
	private Object execute(final CacheOperationInvoker invoker, Method method, CacheOperationContexts contexts) {
		....
		// 从命令中,取出过期指令,优先处理
		processCacheEvicts(contexts.get(CacheEvictOperation.class), true,
				CacheOperationExpressionEvaluator.NO_RESULT);

		// 获取对应的缓存
		Cache.ValueWrapper cacheHit = findCachedItem(contexts.get(CacheableOperation.class));

		// 缓存不存在,则从context中获取 PUT命令
		List<CachePutRequest> cachePutRequests = new LinkedList<>();
		if (cacheHit == null) {
			collectPutRequests(contexts.get(CacheableOperation.class),
					CacheOperationExpressionEvaluator.NO_RESULT, cachePutRequests);
		}

		Object cacheValue;
		Object returnValue;

		// 缓存命令,且不存在PUT
		if (cacheHit != null && !hasCachePut(contexts)) {
			// If there are no put requests, just use the cache hit
			cacheValue = cacheHit.get();
			returnValue = wrapCacheValue(method, cacheValue);
		}
		else {
			// Invoke the method if we don't have a cache hit
			// 存在PUT指令则会执行真实调用
			returnValue = invokeOperation(invoker);
			cacheValue = unwrapReturnValue(returnValue);
		}

		// 根据结果,从context中获取需要执行的put命令
		collectPutRequests(contexts.get(CachePutOperation.class), cacheValue, cachePutRequests);

		// 执行PUT操作
		for (CachePutRequest cachePutRequest : cachePutRequests) {
			cachePutRequest.apply(cacheValue);
		}

		// 根据结果处理过期命令
		processCacheEvicts(contexts.get(CacheEvictOperation.class), false, cacheValue);

		return returnValue;
	}
```

### Cacheable sync处理
在`@Cacheable`中有sync方法，该方法解决了多线程调用问题，对于一些缓存不想多次被调用则可以使用，比如获取微信的ACCESS_TOKEN，该方法实现原理是什么呢？我们可以想象，单机多线程下保证同步的方案的主流方案是排队，包括阻塞锁也是排队的一种实现策略，对于Spring Cache来说，只要让这一类缓存共享一个队列即可，然后每次从队列中取出最近的一个调用，如下图代码所示，这也解释了sync属性注释上提到的诸多限制，比如只能对一个缓存注解生效，不支持unless等。
**清单：同步调用**
```java
if (contexts.isSynchronized()) {
            // 获取@Cacheable注解配置
			CacheOperationContext context = contexts.get(CacheableOperation.class).iterator().next();
			if (isConditionPassing(context, CacheOperationExpressionEvaluator.NO_RESULT)) {
				Object key = generateKey(context, CacheOperationExpressionEvaluator.NO_RESULT);
				Cache cache = context.getCaches().iterator().next();
				try {
                    // 优先从缓存获取,获取不到则调用方法存入缓存
					return wrapCacheValue(method, cache.get(key, () -> unwrapReturnValue(invokeOperation(invoker))));
				}
				catch (Cache.ValueRetrievalException ex) {
					// The invoker wraps any Throwable in a ThrowableWrapper instance so we
					// can just make sure that one bubbles up the stack.
					throw (CacheOperationInvoker.ThrowableWrapper) ex.getCause();
				}
			}
			else {
				// No caching required, only call the underlying method
				return invokeOperation(invoker);
			}
		}
```

### 缓存key生成策略
Spring默认使用SpEL作为key生成的表达式语言，同时还额外提供了`org.springframework.cache.interceptor.KeyGenerator`接口，让用户实现自己的生成策略，可以说是非常灵活了。这里推荐使用**自定义方案**，否则每次都要额外创建EL上下文，然后解析，虽然是轻量操作，但该操作会很频繁。
```java
/**
		 * Compute the key for the given caching operation.
		 */
		@Nullable
		protected Object generateKey(@Nullable Object result) {
        // 当没指定key，则使用SpEL生成该key
			if (StringUtils.hasText(this.metadata.operation.getKey())) {
				EvaluationContext evaluationContext = createEvaluationContext(result);
				return evaluator.key(this.metadata.operation.getKey(), this.metadata.methodKey, evaluationContext);
			}
        // 使用自定义key生成策略
			return this.metadata.keyGenerator.generate(this.target, this.metadata.method, this.args);
		}
        

    // EL上下文创建，可以看到其能获取到的信息，基本是参数中所有的值了
		private EvaluationContext createEvaluationContext(@Nullable Object result) {
			return evaluator.createEvaluationContext(this.caches, this.metadata.method, this.args,
					this.target, this.metadata.targetClass, this.metadata.targetMethod, result, beanFactory);
		}
```

## 总结
Spring Cache可以说是一套在Spring中使用缓存的标准规范，其最大的优势是解耦了缓存逻辑以及业务逻辑，并提供了统一缓存管理能力。
其背后的原理也比较容易理解，另外在设计上给我们提供了Annotation -> Operate -> Context -> Request的一种抽象解决问题模式，值得学习。

## 其他
- 本文基于Spring Boot 2.2.2.RELEASE版本，后续版本可能有所变化