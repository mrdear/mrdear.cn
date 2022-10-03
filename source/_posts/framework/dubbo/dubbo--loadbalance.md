---
title: Dubbo --常见负载均衡算法分析
subtitle: 分析Dubbo源码时引申出来的一个小问题
cover: http://res.mrdear.cn/dubbo.png
author: 
  nick: 屈定
tags:
  - Dubbo
categories: 框架与中间件
urlname: framework-double-loadbalance
date: 2018-05-29 09:05:32
updated: 2020-08-17 22:10:24
---
最近看Dubbo源码时，看到了`LoadBanlance`相关算法，以此为问题出发点，总结下这方面相关的常见算法。（**本文和Dubbo源码并没有太大的关系，只是属于这个系列中遇到的知识总结**）
- - - - -

## 负载均衡的目的是什么？
讨论负载均衡，那么归根结底其要解决的问题是什么？当一台服务器的承受能力达到上限时，那么就需要多台服务器来组成集群，提升应用整体的吞吐量，那么这个时候就涉及到如何合理分配客户端请求到集群中不同的机器，这个过程就叫做负载均衡，当然这也是负载均衡要解决的问题。

由于服务器之间的处理能力差异，因此每台服务器需要有自己的权重比例，为了更好的描述后面所涉及到的算法，因此抽象出一个`Server`类，代表集群中的服务器。`LoadBalance`接口代表负载均衡算法。
```java
public class Server {
  /**
   * 服务器地址
   */
  private String address;
  /**
   * 服务器权重
   */
  private Integer weight;

}

public interface LoadBalance {
  /**
   * 根据负载均衡算法选择最合适的一个Server
   * @param servers 客户端集合
   * @return result
   */
  Server select(List<Server> servers);

}
```

## 权重随机算法
单纯的随机算法通过伪随机数来保证请求均匀的分布到对应的Server上，但是其忽略了每一个服务器处理能力的差异，这样就导致处理能力差的服务可能因为这种绝对的均衡策略而崩掉，改进策略就是根据权重占比随机。算法很简单，就是一根数轴。然后利用伪随机数产生点，确定点落在了哪个区域从而选择对应的`Server`。

**清单1： 权重随机算法**
```java
  @Override
  public Server select(List<Server> servers) {
    ThreadLocalRandom localRandom = ThreadLocalRandom.current();
    // 计算总比重
    int totalWeight = 0;
    for (Server server : servers) {
      totalWeight += server.getWeight();
    }
    // 按照权重选择
    int randomWeight = localRandom.nextInt(totalWeight);
    for (Server server : servers) {
      randomWeight -= server.getWeight();
      if (randomWeight < 0) {
        return server;
      }
    }
    // default
    int length = servers.size();
    return servers.get(localRandom.nextInt(length));
  }
```
算法的关键点是如何高效的确定点落在的区域，其流程是这样，假设`{ a:5 , b:2 ,c:3}`在数轴上如下排列。
![](http://res.mrdear.cn/1527518852.png)
1. 置随机数，随机数范围即数轴的总长度，假设得到的值为6
2. 用该值依次减去数轴上的每一个区域，直到第一次小于0时，那么就属于那个区域。`6-5-2 < 0`，因此6会落在b区域。


## 非平滑权重轮询算法
轮询算法是指依次访问可用服务器列表，其和随机本质是一样的处理，在**无权重因素**下，轮询只是在选数轴上的点时采取自增对长度取余方式。有**权重因素**下依然自增取余，再看选取的点落在了哪个区域。依旧使用上图，举个例子：
![](http://res.mrdear.cn/1527518852.png)
无权重的轮询得到的结果为：`{ a b c a b c a b c ....}`
有权重的轮询得到的结果为：`{ a a a a a b b c c c ...}`.

算法的关键点是每次如何选择下一个，其流程是这样的，定义一个全局的自增变量（需要线程安全），在Java中可以使用`AtomXX`原子类，然后每次选择前线自增，然后利用结果与该数轴取余，再计算余数落在的区域，即被选中的节点。


## 平滑权重轮询算法
对于`{a:5, b:1, c:3)`这三个服务实例，权重轮询会得到`{ a a a a a b c }`这样的访问顺序，这种情况其权重差过大，对于服务器`a`来说依然存在集中访问，为了解决这个问题，Nginx实现了一种平滑的轮询算法，所谓的平滑，是需要打乱集中访问的顺序节点，对于上述权重实例，Nginx的算法得出的访问顺序为`{ a, a, b, a, c, a, a }`，这样的分布显然比直接轮询合理的多。

**清单二：平滑权重轮询算法**
```java
private static final ConcurrentMap<Server, AtomicInteger> ServerMap = new ConcurrentHashMap<>();

@Override
public Server select(List<Server> servers) {
  Server best = null;
  int totalWeight = 0;

  for (Server server : servers) {
    AtomicInteger weightServer = ServerMap.get(server);
    if (null == weightServer) {
      weightServer = new AtomicInteger(0);
      ServerMap.putIfAbsent(server, weightServer);
    }
    int weight = server.getWeight();
    // 加权
    weightServer.addAndGet(weight);

    totalWeight += weight;
    // 根据权选择
    if (null == best || weightServer.get() > ServerMap.get(best).get()) {
      best = server;
    }
  }

  if (null == best) {
    throw new IllegalStateException("can't select client");
  }

  // 降权
  AtomicInteger bestWeightServer = ServerMap.get(best);
  bestWeightServer.set(totalWeight - bestWeightServer.get());

  printSorts(servers);
  return best;
}
```
整个实现算法非常巧妙，大概思想是每一个`Server`的权重都是动态可改变的，在遍历过程中对每一个`Server`的权重做累加，然后选出权重最高的作为best，选中后**再对best做降权**，利用降权操作实现平滑的目的。
以`{a:5, b:2, c:3)`作为输入，选择10次，其输出结果为`{ a a c a b a c a b a }`，下面是部分详情，帮助理解加权与降权的流程。

```java
// 初始化
server name: a weight: 5 effective: 5 current: 0
server name: b weight: 2 effective: 2 current: 0
server name: c weight: 3 effective: 3 current: 0
  
// 第一次选择,以及选择后数据
Server(address=a, weight=5)
server name: a weight: 5 effective: 5 current: 10 - (0+5)=5
server name: b weight: 2 effective: 2 current: 0+2
server name: c weight: 3 effective: 3 current: 0+3

// 第二次选择,以及选择后数据
Server(address=a, weight=5) 
server name: a weight: 5 effective: 5 current: 10 - (5+5)=0
server name: b weight: 2 effective: 2 current: 2+2
server name: c weight: 3 effective: 3 current: 3+3
  
// 第三次选择,以及选择后数据
Server(address=c, weight=5) 
server name: a weight: 5 effective: 5 current: 0+5
server name: b weight: 2 effective: 2 current: 4+2
server name: c weight: 3 effective: 3 current: 10- (6+3)=1

// 第四次选择,以及选择后数据
Server(address=a, weight=3) 
server name: a weight: 5 effective: 5 current: 10-(5+5)= 0
server name: b weight: 2 effective: 2 current: 6+2
server name: c weight: 3 effective: 3 current: 1+3

// 第五次选择,以及选择后数据
Server(address=b, weight=5) 
server name: a weight: 5 effective: 5 current: 0+5
server name: b weight: 2 effective: 2 current: 10-(8+2)=0
server name: c weight: 3 effective: 3 current: 4+3
```

## ip hash算法
ip hash算法又叫`源地址哈希算法`，其根据客户端的ip计算hash值，再利用该hash值对服务器个数取余，从而定位到具体的某一台服务器上，该算法的好处是只要客户端ip不变，那么他的请求总是到同一台服务器，对于缓存等是比较友好的。然而这也是该算法的缺点，动态调整服务器会导致这个hash分布被重新分配，然而在集群中服务器的上下线是经常变动的，因此该算法一般不是很实用，其解决方案是接下来要说的`一致性Hash负载均衡算法`。

## 一致性Hash负载均衡算法
无论是随机还是轮询算法，对于一个客户端的多次请求，每次落到的`Server`很大可能是不同的，如果这是一台缓存服务器，那么这就对缓存同步带来了很大的挑战，当系统繁忙时，主从延迟带来的同步缓慢，可能就造成了同一客户端两次访问得到不同的结果。解决方案是利用hash算法定位到对应的服务器。
1. **普通的Hash**：当客户端请求到达是则使用 hash(client) % N,其中N是服务器数量，利用这个表达式计算出该客户端对应的Server处理，因为客户端总是同一个那么对应的Server也总是同一个。该算法致命的问题是增减服务器，也就是`N +/- 1`,该操作会导致取余的结果变化，重新分配所有的Client，为了解决这个问题，一致性Hash算法诞生了。
2. **一致性Hash**：一致性Hash是把服务器分布变成一个环形，每一个hash(clinet)的结果会在该环上顺时针寻找第一个与其邻的`Server`节点，具体可以参考 [负载均衡--一致性hash算法](https://zhuanlan.zhihu.com/p/34969168)，里面的几幅图描述的很形象。


在**不考虑权重**的条件下，对于`{a:5, b:1, c:1)`三个Server，其组成的数轴首尾相连组成一个环。对于这个环，其规则如下：
1. 计算`hash(client) % 3`，如果该点落在了a-b之前，则找顺时针的邻接点，也就是a。
2. 计算`hash(client) % 3`，如果该点落在了a-c之前，则找顺时针的邻接点，也就是c。
3. 计算`hash(client) % 3`，如果该点落在了a-b之前，则找顺时针的邻接点，也就是b。

![](http://res.mrdear.cn/1527575932.png)
因为对于`Client`来说其hash结果是固定的，因此能保证每一个Client总是能落到唯一确定的一个`Server`上。考虑到特殊情况，当`N +/-   1`,也就是服务器增加或者减少，比如服务器`b`宕机了，那么整个环只剩`a`和`c`，那么原本落在`a`,`c`上的client依然会落到其上，只有原本落在`b`节点上的client才会重新选择Server。反之增加节点也是如此，尽可能的降低重新hash分配的client数量。

**考虑权重**的话，所期望的图应该是按照一定比例设置，那么对应的落点计算变为`hash(client) % TotalWeight`。
![](http://res.mrdear.cn/1527576790.png)
`a`因为权重是5所以其占了圆的一半，因此点落到b-a区间的概率为0.5。
还有一种做法是利用虚拟节点（给`a`创建5个hash值不同的副本），思路是把圆分成等分为10分（a，b，c权重之和为10），然后分配5个`a`，2个`b`，3个`c`，这样增大了hash到`a`区域的几率，也就实现了权重。

在Java中，得益于`NavigableMap`数据结构的强大，其中`tailMap`方法可以直接得到某一个key之后的元素，对应于环中操作就是很容易获取到某一点的相邻点。
```java
 /**
   * 表示一致性Hash算法中的环
   */
  private static final ConcurrentSkipListMap<Long, Server> ServerMap = new ConcurrentSkipListMap<>();

  public Server select(List<Server> servers, String clientIdentify) {
    // 放入环中
    for (Server server : servers) {
      Long hash = hash(server.getAddress());
      if (!ServerMap.containsKey(hash)) {
        addServer(hash,server);
      }
    }
    // 计算client
    Long hash = hash(clientIdentify);
    // 定位到其后面的元素
    ConcurrentNavigableMap<Long, Server> tailMap = ServerMap.tailMap(hash);
    if (null == tailMap.firstEntry()) {
      tailMap = ServerMap.headMap(hash);
    }
    // 获取到邻近的Server
    return tailMap.firstEntry().getValue();
  }
```


## 参考
[平滑的基于权重的轮询算法](http://colobu.com/2016/12/04/smooth-weighted-round-robin-algorithm/)