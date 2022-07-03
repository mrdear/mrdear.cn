---
title: 实践--如何封装第三方服务？
subtitle: 业务开发中经常与第三方打交道，因此不可避免的要封装各种库，这里提供一点经验。
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 实战总结
urlname: work-design-command-model-in-action
date: 2018-07-01 03:07:11
updated: 2018-07-01 03:07:13
---
业务开发中经常会对接某某第三方服务，因此会经常写一些SDK供服务使用，一种比较好的做法就是使用命令模式封装第三方服务，命令模式对于调用方来说简洁明了，也正是封装最根本的目的，便于调用方使用。

## 命令模式

### 定义
命令模式是一种行为型模式，其会把具体的行为封装成一个命令Command，接着指定命令接收者Receiver，最后是在Invoker中执行命令。

其UML图如下：（图片来自[命令模式](http://design-patterns.readthedocs.io/zh_CN/latest/behavioral_patterns/command.html)）
![](https://imgblog.mrdear.cn/1530426470.png?imageMogr2/thumbnail/!100p)

执行时序图如下：
![](https://imgblog.mrdear.cn/1530426529.png?imageMogr2/thumbnail/!100p)

其中角色信息为
- **Command**: 抽象命令类
- **ConcreteCommand**: 具体命令类
- **Invoker**: 调用者，由使用方调用的执行命令的类。
- **Receiver**: 接收者，真正执行命令的地方。通常与Invoker放在一起，逻辑复杂时可以使用这种方式分离依赖。

举个例子，遥控器如果要用命令该怎么实现？

首先分清角色，每一个按钮是一个`ConcreteCommand`，遥控器本身是`Invoker`与`Receiver`的角色，也就是负责命令的执行，当按下按钮时`Invoker`接收到一个`ConcreteCommand`，然后根据内部逻辑触发相应的红外信号，完成整个链路执行。


### 优点
命令模式的优点主要如下：

1. 命令模式对于使用方非常友好，使用方只需要关系命令与执行命令的执行器，而不需要关系具体的执行过程，就像遥控器一样，使用方只需要知道遥控器的位置以及按钮所产生的作用即可。
2. 命令模式内部更加灵活，因为对外的简单，因此对内就可以很灵活的实现各种逻辑，比如命令的记录，撤销，命令队列等等，这些优化在内部很容易实现，并且不会对外部造成影响。
3. 命令模式很直观，当实现新功能时，那么需要做的事添加一个命令对象，编写对应的执行逻辑，如果逻辑是一个通用的逻辑，那么只需要添加完命令对象就实现了这个功能。（这一点在接下来的实战中有体现）

广义上来说前后端交互过程也算是一种命令模式，他们的交互是HTTP协议，也就是具体的命令对象，每次在命令中填充不同的参数，服务端会返回对应所需要的内容，而客户端不需要理会服务端是如何处理的，只需要知道自己可以使用哪些命令（请求参数），这样理解是不是更能体会到命令模式的本质。

## 如何封装？
回到问题本身，如何使用命令模式简化第三方请求？根据上文命令模式的简要讲解，可以发现命令模式与第三方服务的需求很像，第三方给我们提供接口，我们使用接口完成某一个功能，接口就是遥控器按钮，第三方就是遥控器本身。

在第三方请求过程中往往有以下几种角色：
![](http://imgblog.mrdear.cn/1530007398.png?imageMogr2/thumbnail/!100p)

- Req：请求的参数包装类，命令模式下的Command
- Client：与使用者交互的类，其主要功能是控制整个与第三方交互的流程，给出使用者所期望的返回信息，往往全局单例。命令模式下的Invoker与Receiver
- Resp：对应于请求的响应结果包装类，命令模式下执行action()后得到的反馈。
- HttpClient：负责与第三方交互，当然这里只是类比，第三方提供的WebService等等也都是这个角色。

那么封装的目的是让使用者更方便的使用，那么从使用者的角度来观察，使用者往往所期望的是我该填充哪些参数，我该怎么调用请求，我该怎么得到想要的返回值，转换为代码可以理解为以下两行：
```java
// ....context代表 上下文参数
Req req = new Req(context);
Resp resp = client.execute(req);
// .....业务处理
```
这就是最终封装想要得到的结果。

说得再好也不如看代码来的直接，笔者最近在对接一个云账户结算平台，因此使用该思路写了一个示例项目，该示例项目更好的体现了到底该怎么封装，欢迎fork研究一下。
[https://github.com/mrdear/yunzhanghu-sdk-example](https://github.com/mrdear/yunzhanghu-sdk-example)

示例项目封装后，对于使用方只需要以下几步即可轻松使用。
```java
 /**
   * 初始化调用者
   */
  private YunzhanghuClient client =
      new DefaultYunzhanghuClient("0123456", "sha256",
          "78f9b4fad3481fbce1df0b30eee58577", "123456788765432112345678", new WebUtils());

  @Test
  public void test() {
    // 构造银行卡三要素验证命令
    VerifyBankcardThreeFactorReq req = new VerifyBankcardThreeFactorReq();
    req.setCardNo("");
    req.setIdCard("");
    req.setRealName("");

    // 发送命令,并拿到返回值
    VerifyBankcardThreeFactorResp resp = client.execute(req);

    System.out.println(resp);
  }
```

### 其他问题

#### 包结构建议
分包原则就是整个jar的package该如何组织，这里参考`alipay-sdk`的分法。其中`internal`包是你不想被外部使用的一些类定义，比如转为此次对接定制的签名类，定制的Http类等等，因为Java没有对应的module作用域，因此放在`internal`中算是一种约定。
```txt
com
└── alipay
    └── api
        ├── domain    // 一些实体类，主要为request与response服务，构成其内部的属性
        ├── internal    // 仅供sdk使用的内部工具，不希望外部使用
        ├── request    // 发送请求信息的包装类
        └── response   // 封装返回信息的包装类
        └── commom.java ....      // 一些对外公共的类
```
下图是笔者在对接云账户结算平台时所定义的包结构，可以作为参考。
![](http://imgblog.mrdear.cn/1530420796.png?imageMogr2/thumbnail/!100p)

#### 提高扩展灵活性建议
对于灵活性的提升需要使用依赖倒置原则，也就是关键点需要依赖对应的接口。比如在一个封装过程中其`HttpClient`的实现往往就需要暴露出接口，便于使用方针对连接复用，参数调优等等。

举个例子，笔者在对接第三方平台时会把Http请求以接口形式暴露出去，如下所示：
```java
public interface YunzhanghuWebClient {
  /**
   * 单纯的get请求
   *
   * @return 结果
   */
  String yzh_Get(Map<String, Object> headers, String url, Map<String, Object> queryParam) throws Exception;

  /**
   * 单纯的post请求
   *
   * @return 结果
   */
  String yzh_Post(Map<String, Object> headers, String url, Map<String, Object> formParam) throws Exception;

}
```
然后再封装一个用于自己业务的`WebUtils`实现，其中会加入自己的业务逻辑。
```java
public class YzhWebUtils {

  private YunzhanghuWebClient yunzhanghuWebClient;

  public YzhWebUtils(YunzhanghuWebClient yunzhanghuWebClient) {
    this.yunzhanghuWebClient = yunzhanghuWebClient;
  }

  public String doGet(String dealerId, String requestId, String url, Map<String, Object> queryParam) {
    try {
      Map<String, Object> header = new HashMap<>(2);
      header.put("dealer-id", dealerId);
      header.put("request-id", requestId);
      // 调用外部提供的http请求
      return yunzhanghuWebClient.yzh_Get(header, url, queryParam);
    } catch (Exception e) {
      logger.error("yunzhanghu get error, url is {}",url, e);
      return "";
    }
  }
}
```

