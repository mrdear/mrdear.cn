---
title: 设计模式--动态代理的思考
subtitle: 关于动态代理模式的一些案例，以及业务上的扩展
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-proxy
date: 2018-05-13 11:05:41
updated: 2018-05-13 11:05:43
---
在一些第三方框架中经常能看到动态代理的案例,尤其是RPC框架,ORM框架等,该篇将分析这些实现的原理,另外延伸在业务中的使用示例.
- - - - - 
 
## 动态代理模式
关于代理模式在之前的[关于IOC与AOP的一些理解](https://mrdear.cn/2018/04/14/framework/spring/spring--ioc_aop/)中已经有了一些分析,所以在此不再叙述,只需要理解以下两点即可:
1. 动态代理的本质是**控制对对象的访问**,通过代理类,每一个方法请求都会转到对应的`invoker()`方法中,从而实现各种**hack**的逻辑,比如RPC的远程调用,Mybatis的Mapper代理等等.
2. AOP是基于动态代理,但是其与动态代理不同的是AOP要增强的那个类是实实在在存在的,动态代理只是起到了分发方法请求的作用,在分发过程中执行了自定义的逻辑从而达到的增强处理.

下面举几个例子，可以更好的理解**控制对对象的访问**这一本质。

## 动态代理与延迟加载
延迟加载是一种常用的系统优化手段，让系统运行时做到真正需要的时候才去加载，其目的是为了避免一些无所谓的开销，比如我要查询User类并且只需要知道用户名信息，那么对应的Classroom信息，邮箱信息等实际上都是不需要的，那么这样的情景就非常适合延迟加载。但是如果我要查询User信息以及对应的Classroom信息，此时Classroom信息使用延迟加载就很不合适，也就是常见的N+1问题（查询User是1，查询对应的Classroom是N次关联查询），反而降低了系统性能，因此延迟加载的使用与否取决于你的业务场景。

### 1. ORM框架的延迟加载
ORM的延迟加载一般都是利用动态代理来实现,比如`Hibernate`、`Mybatis`，如下图所示,用户需要的是User类,因此利用`Cglib`,`Javaassit`等技术生成对应的代理类给用户，因为代理类UserProxy是User的子类,其利用`super`转发对User的请求到对应的`MethodInterceptor`中,从而达到拦截的目的，拦截后就可以判断是否需要延迟加载，需要则根据一定策略去对应的`Repository`中获取数据。
![](http://res.mrdear.cn/1525485610.png?imageMogr2/thumbnail/!100p)

### 2.利用延迟加载优化FutureTask
`FutureTask`是 Java5提供的一种异步任务编程方式。`FutureTask`存在的问题是获取值麻烦，需要手动调用 get()方法并且捕捉其中的异常信息,如下调用形式:
```java
 @Test
  public void testOldFindById() {
    long startTime = System.currentTimeMillis();
    // 1显式创建
    FutureTask<User> userTask = new FutureTask<>(() -> userService.findById(1L));
    // 2显式提交
    executorService.submit(userTask);
    // 3显式获取
    final User user;
    try {
      user = userTask.get();
    } catch (InterruptedException e) {
      e.printStackTrace();
    } catch (ExecutionException e) {
      e.printStackTrace();
    }
    System.out.println(user);
    Assert.assertTrue(System.currentTimeMillis() - startTime > 2000L);
    Assert.assertTrue(System.currentTimeMillis() - startTime < 3000L);
  }
```
可以说是相当麻烦了。
一种解决方案是使用动态代理,当创建`FutureTask`之后,将其放入线程池,然后返回一个代理类供客户端使用,当客户端调用代理类的相应方法时,在代理类中则会调用` future.get() `方法达到转发到真实的`FutureTask`结果上,那么对于客户端来说是无感知异步的存在。
```java
  @Test
  public void testNewQueryByIds() throws ExecutionException, InterruptedException {
    long startTime = System.currentTimeMillis();
    // 准备该异步任务需要的配置(线程池与超时时间)
    AsyncLoadConfig config = new AsyncLoadConfig(Executors.newCachedThreadPool(),3000L);
    AsyncLoadTemplate template = new AsyncLoadTemplate(config);
    // 使用模板方式执行异步任务,返回代理类
    List<User> users = template.execute(new Callable<List<User>>() {
      @Override
      public List<User> call() throws Exception {
        Thread.sleep(2000);
        return Collections.singletonList(User.mockUser());
      }
    });
    // 模拟耗时操作
    Thread.sleep(2000);
    Assert.assertTrue(System.currentTimeMillis() - startTime > 2000L);
    Assert.assertTrue(System.currentTimeMillis() - startTime < 2500L);
    // 打印实际上调用 toString() 方法,其会作用到异步任务返回的真实类上
    System.out.println(users);
  }
```
该方式本质上是ORM 的延迟加载的扩展应用,只不过延迟加载获取数据是到 DB 中拉取,而这里是去异步任务`Future`中获取.
针对上面的案例笔者写了一个小Demo，可以参考下：
[https://github.com/mrdear/tiny-asyncload](https://github.com/mrdear/tiny-asyncload)

### 动态代理在RPC上的应用
RPC遇到的问题是`Consumer`端只有接口，因此RPC框架`Consumer`的调用一般都是基于动态代理实现，原因是对于`Consumer`端，是无法拿到`Provider端`的实例，两端唯一有关联的就是接口，因此使用动态代理把请求利用TCP通信转到对应的`Provider端`,然后取回对方返回的数据再转成自己想要的数据.
![](http://res.mrdear.cn/1525487660.png?imageMogr2/thumbnail/!100p)

下面转自梁飞大大（dubbo作者）的博客，更能深切的体会到RPC原理的简单。
[RPC框架几行代码就够了](http://javatar.iteye.com/blog/1123915#bc2402961)

因为要给百技上实训课，让新同学们自行实现一个简易RPC框架，在准备PPT时，就想写个示例，发现原来一个RPC框架只要一个类，10来分钟就可以写完了，虽然简陋，也晒晒： 

```java
/* 
 * Copyright 2011 Alibaba.com All right reserved. This software is the 
 * confidential and proprietary information of Alibaba.com ("Confidential 
 * Information"). You shall not disclose such Confidential Information and shall 
 * use it only in accordance with the terms of the license agreement you entered 
 * into with Alibaba.com. 
 */  
package com.alibaba.study.rpc.framework;  
  
import java.io.ObjectInputStream;  
import java.io.ObjectOutputStream;  
import java.lang.reflect.InvocationHandler;  
import java.lang.reflect.Method;  
import java.lang.reflect.Proxy;  
import java.net.ServerSocket;  
import java.net.Socket;  
  
/** 
 * RpcFramework 
 *  
 * @author william.liangf 
 */  
public class RpcFramework {  
  
    /** 
     * 暴露服务 
     *  
     * @param service 服务实现 
     * @param port 服务端口 
     * @throws Exception 
     */  
    public static void export(final Object service, int port) throws Exception {  
        if (service == null)  
            throw new IllegalArgumentException("service instance == null");  
        if (port <= 0 || port > 65535)  
            throw new IllegalArgumentException("Invalid port " + port);  
        System.out.println("Export service " + service.getClass().getName() + " on port " + port);  
        ServerSocket server = new ServerSocket(port);  
        for(;;) {  
            try {  
                final Socket socket = server.accept();  
                new Thread(new Runnable() {  
                    @Override  
                    public void run() {  
                        try {  
                            try {  
                                ObjectInputStream input = new ObjectInputStream(socket.getInputStream());  
                                try {  
                                    String methodName = input.readUTF();  
                                    Class<?>[] parameterTypes = (Class<?>[])input.readObject();  
                                    Object[] arguments = (Object[])input.readObject();  
                                    ObjectOutputStream output = new ObjectOutputStream(socket.getOutputStream());  
                                    try {  
                                        Method method = service.getClass().getMethod(methodName, parameterTypes);  
                                        Object result = method.invoke(service, arguments);  
                                        output.writeObject(result);  
                                    } catch (Throwable t) {  
                                        output.writeObject(t);  
                                    } finally {  
                                        output.close();  
                                    }  
                                } finally {  
                                    input.close();  
                                }  
                            } finally {  
                                socket.close();  
                            }  
                        } catch (Exception e) {  
                            e.printStackTrace();  
                        }  
                    }  
                }).start();  
            } catch (Exception e) {  
                e.printStackTrace();  
            }  
        }  
    }  
  
    /** 
     * 引用服务 
     *  
     * @param <T> 接口泛型 
     * @param interfaceClass 接口类型 
     * @param host 服务器主机名 
     * @param port 服务器端口 
     * @return 远程服务 
     * @throws Exception 
     */  
    @SuppressWarnings("unchecked")  
    public static <T> T refer(final Class<T> interfaceClass, final String host, final int port) throws Exception {  
        if (interfaceClass == null)  
            throw new IllegalArgumentException("Interface class == null");  
        if (! interfaceClass.isInterface())  
            throw new IllegalArgumentException("The " + interfaceClass.getName() + " must be interface class!");  
        if (host == null || host.length() == 0)  
            throw new IllegalArgumentException("Host == null!");  
        if (port <= 0 || port > 65535)  
            throw new IllegalArgumentException("Invalid port " + port);  
        System.out.println("Get remote service " + interfaceClass.getName() + " from server " + host + ":" + port);  
        return (T) Proxy.newProxyInstance(interfaceClass.getClassLoader(), new Class<?>[] {interfaceClass}, new InvocationHandler() {  
            public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {  
                Socket socket = new Socket(host, port);  
                try {  
                    ObjectOutputStream output = new ObjectOutputStream(socket.getOutputStream());  
                    try {  
                        output.writeUTF(method.getName());  
                        output.writeObject(method.getParameterTypes());  
                        output.writeObject(arguments);  
                        ObjectInputStream input = new ObjectInputStream(socket.getInputStream());  
                        try {  
                            Object result = input.readObject();  
                            if (result instanceof Throwable) {  
                                throw (Throwable) result;  
                            }  
                            return result;  
                        } finally {  
                            input.close();  
                        }  
                    } finally {  
                        output.close();  
                    }  
                } finally {  
                    socket.close();  
                }  
            }  
        });  
    }  
}  
```
用起来也像模像样： 

**(1) 定义服务接口 **
```java
/* 
 * Copyright 2011 Alibaba.com All right reserved. This software is the 
 * confidential and proprietary information of Alibaba.com ("Confidential 
 * Information"). You shall not disclose such Confidential Information and shall 
 * use it only in accordance with the terms of the license agreement you entered 
 * into with Alibaba.com. 
 */  
package com.alibaba.study.rpc.test;  
  
/** 
 * HelloService 
 *  
 * @author william.liangf 
 */  
public interface HelloService {  
  
    String hello(String name);  
  
} 
```
**(2) 实现服务 **
```java
/* 
 * Copyright 2011 Alibaba.com All right reserved. This software is the 
 * confidential and proprietary information of Alibaba.com ("Confidential 
 * Information"). You shall not disclose such Confidential Information and shall 
 * use it only in accordance with the terms of the license agreement you entered 
 * into with Alibaba.com. 
 */  
package com.alibaba.study.rpc.test;  
  
/** 
 * HelloServiceImpl 
 *  
 * @author william.liangf 
 */  
public class HelloServiceImpl implements HelloService {  
  
    public String hello(String name) {  
        return "Hello " + name;  
    }  
  
}  
```
**(3) 暴露服务 **
```java
/* 
 * Copyright 2011 Alibaba.com All right reserved. This software is the 
 * confidential and proprietary information of Alibaba.com ("Confidential 
 * Information"). You shall not disclose such Confidential Information and shall 
 * use it only in accordance with the terms of the license agreement you entered 
 * into with Alibaba.com. 
 */  
package com.alibaba.study.rpc.test;  
  
import com.alibaba.study.rpc.framework.RpcFramework;  
  
/** 
 * RpcProvider 
 *  
 * @author william.liangf 
 */  
public class RpcProvider {  
  
    public static void main(String[] args) throws Exception {  
        HelloService service = new HelloServiceImpl();  
        RpcFramework.export(service, 1234);  
    }  
  
}  
```

**(4) 引用服务 **
```java
/* 
 * Copyright 2011 Alibaba.com All right reserved. This software is the 
 * confidential and proprietary information of Alibaba.com ("Confidential 
 * Information"). You shall not disclose such Confidential Information and shall 
 * use it only in accordance with the terms of the license agreement you entered 
 * into with Alibaba.com. 
 */  
package com.alibaba.study.rpc.test;  
  
import com.alibaba.study.rpc.framework.RpcFramework;  
  
/** 
 * RpcConsumer 
 *  
 * @author william.liangf 
 */  
public class RpcConsumer {  
      
    public static void main(String[] args) throws Exception {  
        HelloService service = RpcFramework.refer(HelloService.class, "127.0.0.1", 1234);  
        for (int i = 0; i < Integer.MAX_VALUE; i ++) {  
            String hello = service.hello("World" + i);  
            System.out.println(hello);  
            Thread.sleep(1000);  
        }  
    }  
      
}  
```