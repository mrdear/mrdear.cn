---
title: Dubbo -- 关于老项目替换dubbo的一点经验
cover: http://imgblog.mrdear.cn/dubbo.png
author: 
  nick: 屈定
tags:
  - Dubbo    
categories: 框架与中间件
urlname: framework-double-replace
date: 2017-07-23 09:07:41
updated:  2017-07-23 09:07:41
---

### 背景
公司一直以来使用内部编写的一个rpc框架,简称old_rpc这套RPC框架,由于历史原因,old_rpc存在如下缺点.
1. old_rpc已经很久没人维护了,因此出了错误很难定位到具体的原因.
2. old_rpc本身只是RPC框架,随着项目的增多各个项目之间的依赖关系已经很复杂了,需要一套支持服务治理的解决方案.
3. old_rpc缺乏监控平台,对于动态部署,增加机器或者减少机器都比较麻烦.
4. ...
这些缺点已经严重影响到线上稳定性,本文就dubbox替换掉old_rpc方案做的一个调研,对工作量,替换后的稳定性做一个评估,以供大家参考.

### 替换要求
1. 支持平滑上线,也就是说替换后依然支持现有的测试系统,发布系统.
2. 替换必须尽可能小的缩小对业务的影响,代码层面上来看就是业务处理代码中不应该有替换的代码
3. 短期内需要支持dubbox与old_rpc两套方案,并且两套方案可以快速切换,防止替换后线上出现不可预料的问题.

### 替换思路
1. saturn作为服务提供者,替换比较简单,只需要在原有基础上,增加dubbo协议的Service.
2. vienna作为消费者,使用dubbo协议引入dubbo的service
3. vienna增加断路器配置,对于repo层引入的service,dubbox作为主service,old_rpc作为备份service,当主service调用失败则自动切换到备份service进行重试,此过程需要有监控.

### dubbox
- github: [https://github.com/dangdangdotcom/dubbox](https://github.com/dangdangdotcom/dubbox)
clone下来后使用`mvn package -DskipTests`,会打包该项目,生成主要的**dubbo.jar**,以及管理平台**dubbo-admin.war**,监控平台**dubbo-simple-monitor.tar.gz**.我已经把相关jar,deploy到公司的nexus上了.mvn的pom中直接引入如下依赖,这里需要去除Spring依赖,dubbox是基于Spring3开发的,强制引入会与现有项目产生冲突.
另外dubbox添加了kryo和FST序列化支持,以及多种新特性,使用的话均需要引入相应的jar,具体参考项目的github.
```
 <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
            <version>2.8.4</version>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework</groupId>
                    <artifactId>*</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
```

#### zk注册中心
dubbo的注册如下所示:
![](http://imgblog.mrdear.cn/1500736706.png?imageMogr2/thumbnail/!100p)
实际操作下来,第三层还会有`routers`,`configurators`节点,当在dubbo-admin平台操作该service时,比如倍权,该操作会存在在这些节点中.

#### 服务提供者saturn
saturn作为服务提供者,其任务是抛出新的dubbo服务RPC接口.在引入上述pom后,需要做少量的配置.

##### dubbo基本配置
因此demo只测试能否实现,每一个配置的详细内容并未研究,详细可以参考官方文档配置.
```java
@Configuration
public class DubboConfig {
  /**
   * 注册中心配置
   */
  @Bean
  public RegistryConfig registry() {
    RegistryConfig registryConfig = new RegistryConfig();
    registryConfig.setAddress("115.159.185.14:2181");
    registryConfig.setProtocol("zookeeper");
    return registryConfig;
  }

  /**
   * 当前应用配置
   */
  @Bean
  public ApplicationConfig application() {
    ApplicationConfig applicationConfig = new ApplicationConfig();
    applicationConfig.setName("saturn");
    return applicationConfig;
  }

  /**
   * 监控配置,监控需要dubbo-monitor
   */
  @Bean
  public MonitorConfig monitorConfig() {
    MonitorConfig mc = new MonitorConfig();
    mc.setProtocol("registry");
    return mc;
  }

  /**
   * 提供者监控服务
   */
  @Bean
  public ProviderConfig provider() {
    ProviderConfig providerConfig = new ProviderConfig();
    providerConfig.setMonitor(monitorConfig());
    return providerConfig;
  }

  /**
   * 消费者监控
   */
  @Bean
  public ReferenceConfig referenceConfig() {
    ReferenceConfig rc = new ReferenceConfig();
    rc.setMonitor(monitorConfig());
    return rc;
  }

  /**
   * RPC协议配置
   */
  @Bean
  public ProtocolConfig protocol() {
    ProtocolConfig protocolConfig = new ProtocolConfig();
    protocolConfig.setPort(20880);
    return protocolConfig;
  }
  
}

```
##### 提供服务
服务的提供利用的是`ServiceBean`包裹,形成该bean的代理类,可以写一个通用的配置函数
```java
  /**
   * 通用service配置类
   * @param saturnService 对应服务
   * @return dubbo服务
   */
  private <T> ServiceBean<T> configService(T saturnService) {
    ServiceBean<T> serviceBean = new ServiceBean<>();
    serviceBean.setProxy("javassist");
    serviceBean.setVersion("1.0");
    serviceBean.setInterface(saturnService.getClass().getInterfaces()[0].getName());
    serviceBean.setRef(saturnService);
    serviceBean.setTimeout(2000);
    serviceBean.setRetries(3);
    return serviceBean;
  }
```
那么我想要抛出IUserService这个服务,只需要如下几行代码
```java
  @Bean
  public ServiceBean<IUserService> userServiceExport(IUserService userService) {
    return configService(userService);
  }
```
到此提供者配置完毕.

#### 服务消费者vienna(无断路器版本)
vienna作为服务消费者与提供者一样也需要基本的dubbo配置,两者配置几乎一模一样.

##### dubbo基本配置
```java
@Configuration
@EnableAspectJAutoProxy
public class DubboConfig {

  /**
   * 注册中心
   */
  @Bean
  public RegistryConfig registry() {
    RegistryConfig registryConfig = new RegistryConfig();
    registryConfig.setAddress("115.159.185.14:2181");
    registryConfig.setProtocol("zookeeper");
    registryConfig.setTimeout(60000);// vienna不知道为什么链接zk很慢
    return registryConfig;
  }

  /**
   * 应用信息,计算依赖关系
   */
  @Bean
  public ApplicationConfig application() {
    ApplicationConfig applicationConfig = new ApplicationConfig();
    applicationConfig.setName("vienna");
    return applicationConfig;
  }

  /**
   * 监控中心地址
   */
  @Bean
  public MonitorConfig monitorConfig() {
    MonitorConfig mc = new MonitorConfig();
    mc.setProtocol("registry");
    return mc;
  }

  /**
   * 提供者监控服务
   */
  @Bean
  public ProviderConfig provider() {
    ProviderConfig providerConfig = new ProviderConfig();
    providerConfig.setMonitor(monitorConfig());
    return providerConfig;
  }

  /**
   * 消费者监控
   */
  @Bean
  public ReferenceConfig referenceConfig() {
    ReferenceConfig rc = new ReferenceConfig();
    rc.setMonitor(monitorConfig());
    return rc;
  }

  /**
   * 协议配置,自身无提供者的话可以不配置
   */
  @Bean
  public ProtocolConfig protocol() {
    ProtocolConfig protocolConfig = new ProtocolConfig();
    protocolConfig.setPort(20880);
    return protocolConfig;
  }
}

```
##### 配置消费者
消费者是用`ReferenceBean`类来代理的,可以像提供者那样写一个通用的处理方法
```java
  /**
   * 基本配置类
   * @param serviceReference 接口
   */
  private <T> ReferenceBean<T> configReference(Class<T> serviceReference) {
    ReferenceBean<T> ref = new ReferenceBean<>();
    ref.setVersion("1.0");
    ref.setInterface(serviceReference);
    ref.setTimeout(2000);
    ref.setRetries(3);
    ref.setCheck(false);
    ref.setLoadbalance("roundrobin");
    return ref;
  }
```
那么引用服务也就只需要几行代码即可,为了更好的与old_rpc服务区分对于dubbo引入的服务都加上dubbo前缀命名.
```java
  @Bean(name = "dubboUserService")
  public ReferenceBean<IUserService> userService() {
    return configReference(IUserService.class);
  }
```

##### 替换old_rpc
无断路器版本替换就很简单了,找到引用该服务的地方,在Spring注入时为其选择注入dubbo服务即可.问题是一旦该服务出现了问题,那么需要手动切换回old_rpc服务.
```java
 @Resource
  private IUserService dubboUserService;
```

#### 服务消费者vienna(断路器版本)
断路器本身是做服务降级,防止系统因一个服务出问题而产生雪崩效应,对于当前系统的两套RPC方案可以利用这一点把要替换掉的old_rpc作为降级服务,当dubboService出现异常时可以立即去调取old_rpc的服务,从而保证系统的健壮性.
##### 断路器要求
1. 业务代码无侵入,可以使用方法级别的注解控制该方法是否走断路器.稳定后可以直接删除,不留痕迹.
2. 支持自动熔断,自动恢复
3. 有支持集群的监控服务,方便排查出现问题的服务.

##### 断路器依赖
对于上述要求,符合条件,又经得起生产考验的大概只有hystrix了,github地址为 [https://github.com/Netflix/Hystrix](https://github.com/Netflix/Hystrix),pom依赖如下,主要是核心服务包,注解包,监控包.
```java
    <dependency>
            <groupId>com.netflix.hystrix</groupId>
            <artifactId>hystrix-javanica</artifactId>
            <version>1.5.12</version>
        </dependency>
        <dependency>
            <groupId>com.netflix.hystrix</groupId>
            <artifactId>hystrix-metrics-event-stream</artifactId>
            <version>1.5.12</version>
        </dependency>
```
##### 实现思路
实现思路与feign对hystrix的包装很相像,以UserRepo为例,UserRepo中引入了userService服务,那么要自动切换则需要两个UserRepo,一个是引用了dubbox的dubboUserService,一个是引用了old_rpc的old_rpcUserService.断路器是方法级别的监控,使用AOP可以轻松地拦截UserRepo中每一个方法的执行,在执行时使用hystrix包装,执行失败时再使用另一个UserRepo重新执行该方法.
上述流程有几个要点:
1. 需要通过引用dubbo服务的UserRepo获取到引入old_rpc的UserRepo
2. 需要获取到UserRepo中全部的public方法,方便二次调用.
3. 可以从UserRepo中得到断路器的配置,比如分组,线程池等信息.

##### 增强Repo功能
上述的几个要点需要在UserRepo中附加的功能使用一个接口来抽象.
```java
public interface IDubboRepoProxy extends InitializingBean,ApplicationContextAware {

  /**
   * 获取使用dubbo服务调用的Repo
   */
  IDubboRepoProxy getDubboRepo();

  /**
   * 获取当前类所有的public方法
   * @return 键与值都是该方法
   */
  Map<Method, Method> getAllPublicMethods();

  /**
   * 得到断路器的配置
   */
  HystrixCommand.Setter getHystrixSetter();

}

```
为了让实现类更少的写代码,再为其定义一个抽象类,该抽象类主要负责接口功能的实现,其中`initOtherRepo`作为抽象方法,需要子类来实现,也就是初始化备份的Repo.
```java
public abstract class DubboRepoProxyImpl<T extends IDubboRepoProxy> implements IDubboRepoProxy{

  @Getter
  private ApplicationContext context;

  @Setter
  private T otherRepo;

  private Map<Method, Method> publicMethodMap = Maps.newHashMap();

  private HystrixCommand.Setter setter;


  @Override
  public IDubboRepoProxy getDubboRepo() {
    return otherRepo;
  }

  @Override
  public Map<Method, Method> getAllPublicMethods() {
    return publicMethodMap;
  }

  @Override
  public HystrixCommand.Setter getHystrixSetter() {
    return setter;
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    //init repo
    initOtherRepo();
    //init method
    Class<? extends IDubboRepoProxy> old_rpcClass = this.otherRepo.getClass();
    for (Method method : old_rpcClass.getDeclaredMethods()) {
      publicMethodMap.put(method, method);
    }
    //init setter
    setter = HystrixCommand.Setter
        .withGroupKey(HystrixCommandGroupKey.Factory.asKey(this.getClass().getName()))
        .andCommandKey(HystrixCommandKey.Factory.asKey(this.getClass().getSimpleName()));
  }

  public abstract void initOtherRepo();

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    this.context = applicationContext;
  }
}

```
##### 使用AOP动态切换
上述接口与抽象类会赋予UserRepo我们想要的功能.接下来就是AOP拦截.因为断路器是方法级别的操作,因此该AOP只拦截方法,为了更好的配置增加一个AOP专用注解
```java
//该注解修饰的方法会被AOP拦截
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AutoDubboAspect {}
```
然后写具体的拦截器.该拦截器责任就是按部就班的执行之前的思路.
```java
@Component
@Aspect
public class AutoDubboAspectImpl {

  private static Logger logger = LoggerFactory.getLogger(AutoDubboAspectImpl.class);

  @Pointcut("@annotation(com.duitang.context.dubbo.AutoDubboAspect)")
  public void autoDubboAspect() {
  }

  //环绕通知
  @Around("autoDubboAspect()")
  public Object autoCheck(ProceedingJoinPoint pjp) throws Throwable {
    //要执行的主repo
    IDubboRepoProxy target = (IDubboRepoProxy) pjp.getTarget();
    //备用repo
    IDubboRepoProxy otherRepo = target.getDubboRepo();
    //该repo中所有方法
    Map<Method, Method> methods = target.getAllPublicMethods();
    //断路器执行
    HystrixCommand<Object> hystrixCommand = new HystrixCommand<Object>(
        target.getHystrixSetter()) {
      @Override
      protected Object run() throws Exception {
        try {
          return pjp.proceed();
        } catch (Throwable throwable) {
          //异常直接抛出
          throw new RuntimeException(throwable);
        }
      }

      /**
       * 备用降级方案
       */
      @Override
      protected Object getFallback() {
        logger.error("start getFallback,this exception is {}", this.getFailedExecutionException());
        logger.error("start getFallback", pjp.getSignature().toLongString());
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        //获取执行方法
        Method method = methods.get(signature.getMethod());
        if (method == null) {
          return null;
        }
        try {
          //使用备用repo执行该方法
          return method.invoke(otherRepo, pjp.getArgs());
        } catch (IllegalAccessException | InvocationTargetException e) {
          logger.error("getFallback error,{}",e);
        }
        return null;
      }

    };
    return hystrixCommand.execute();
  }
}

```
到此准备工作算是结束,下面是真正的替换.

##### 开始替换old_rpc服务
因为准备的充分,那么替换就变得相当简单了.首先为UserRepo增强功能,也就是继承抽象类`DubboRepoProxyImpl`
```
public class UserRepo extends DubboRepoProxyImpl<UserRepo>
```
然后实现`initOtherRepo`方法,该方法主要是从Spring容器中获取到old_rpc的服务,然后再初始化一个UserRepo.
```java
 @Override
  public void initOtherRepo() {
    if (null != getContext()) {
      IUserService userService = getContext().getBean("userService", IUserService.class);
      IRelationshipService relationshipService = getContext().getBean("relationshipService",
          IRelationshipService.class);
      IUserInterestsService userInterestsService = getContext().getBean("userInterestsService",
          IUserInterestsService.class);
      IFriendRecomendService friendRecomendService = getContext().getBean("friendRecomendService",
          IFriendRecomendService.class);
      //备用old_rpc服务
      UserRepo userRepo = new UserRepo(userService, this.appealAccountService, this.datasourceService,
          relationshipService, this.lifeArtistService, userInterestsService, this.jedisPersist, friendRecomendService);
      this.setOtherRepo(userRepo);
    }
  }
```
最后为想要实现短路功能的方法加上注解.
```java
  @AutoDubboAspect
  public BaseUser findBasicInfo(long userId) {
    ...
  }
```

### 注意事项
#### 消费者无法从zk中获取提供者信息?
这种情况大多数都是因为配置时两方信息不一致导致,可以去dubbo-admin平台检查提供者完整的url,再与日志中消费者引用的url做个比较,定位到问题.
#### zk连接超时
zk是我在自己服务器上部署的,在vienna项目中配置了外网地址,在prism环境中启动后总是出现zk连接超时,后来测试要连上zk大概需要20秒左右,索性把超时时间配置为60秒,解决,具体原因未知.
#### saturn中配置zk注册服务后测试案例无法跑通
这个问题是我在saturn配置了测试环境的zk,
```java
  @Bean
  public RegistryConfig registry() {
    RegistryConfig registryConfig = new RegistryConfig();
    registryConfig.setAddress("10.1.4.10:2181");
    registryConfig.setProtocol("zookeeper");
    return registryConfig;
  }
```
但是jenkins打包时,测试案例一直失败,大概要打包10多分钟,问题有点莫名其妙,在测试时避免Spring引入该bean即可解决.
### 总结
整体过程是比较顺利的,下篇再记录dubbo-admin与dubbo-monitor,以及hystrix-dashborad的搭建.