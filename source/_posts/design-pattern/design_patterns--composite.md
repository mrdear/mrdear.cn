---
title: 设计模式--组合模式的思考
subtitle: 关于组合模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-composite
date: 2018-04-01 04:04:17
updated: 2018-04-18 10:04:39
---
<!-- toc -->
- - - - -

组合模式是一种抽象树形结构的模式,其在业务开发中也是一种很有用的设计模式，组合模式只要解决开发中的树形结构问题，比如职责关系，部门关系等，下面开始分析。

## 组合模式
业务中有很多树形结构的表示,比如下面的目录结构
```txt
-- 男装
    -- 上衣
        -- 品牌1
        -- 品牌2
    -- 裤子
        -- 品牌1
        -- 品牌3
```
针对`男装`可以认为其是树的**根节点**,`上衣`,`裤子`这种下面还可以有节点的称为**树枝节点**,`品牌`这种下面不再有分支的称为**叶子节点**
那么转换成面向对象该怎么表示呢?

### 一般做法
```java
// 根节点
public class RootNode {
  private List<CompositeNode> compositeNodes;// 针对节点区别对待,导致处理麻烦
  private List<LeafNode> leafNodes; // 针对节点区别对待,导致处理麻烦
}
// 树枝节点
public class CompositeNode {
  private List<LeafNode> leafNodes; 
  private List<CompositeNode> compositeNodes; 
}
// 叶子节点
public class LeafNode {
}
```
这种做法是面向对象的思想,但是其最大的问题是对这三种类型的节点区别对待了,那么客户端就必须明确的得知这个节点到底是根还是树枝或者是叶子,那么对于客户端来说无疑是比较辛苦的,另外从功能上来说节点之间区别并不是很大,可以说是完全一样的.那么组合模式的作用就是统一这三种类型的节点,让客户端当成一种节点来处理.下面是组合模式下的方式

### 组合设计
```java
// 其为节点的约束,主要暴露给客户端,客户端不需要了解子类是什么.
public abstract class Node {
}
// 树枝节点,当然也可以是根节点
public class CompositeNode extends Node {
    // 持有Node集合,可以无限往下延伸
  private List<Node> nodes;
}
// 叶子节点,其下面不再有其他节点
public class LeafNode extends Node {
}
```
那么相比之前的设计好在了哪里?组合体现在了哪里?
1. 相比之前设计,这里用了一个抽象类暴露出去给客户端,只需要把客户端需要的方法定义在抽象类中,那么大大减少了客户端的理解成本,对于客户端来说节点都是一个性质的,没必要区分根,树枝,叶子等.
2. 组合体现在`CompositeNode`节点的设计,其内部引用的是`Node`抽象类实例,也就是可以一直往下延伸.
3. 组合模式下，问题简化到节点本身，最外层只负责构建节点关系，每个节点该做什么事情由自身类型所决定，调用链则类似一个递归过程
 
## Mybatis中的组合模式应用
开发中我们写的动态Sql,Mybatis会按照下面方式去理解这个结构,比如
```xml
	<select id="findById" resultMap="RM-CLASSROOM">
		SELECT <include refid="RM-CLASSROOM-ALLCOLS"/>
		FROM classroom WHERE status = 0
		<if test="!ids.isEmpty()">
			AND id in 
			<foreach collection="list" item="item" open="(" close=")" separator=",">
				#{item}
			</foreach>
		</if>
	</select>
```
Mybatis解析后大概会是下面的这种树形结构,最后在拼接成需要的Sql.
```txt
-- select  根节点
    -- select  叶子节点
    -- <include refid="RM-CLASSROOM-ALLCOLS"/> 叶子节点
    -- where status = 1 叶子节点
    -- <if test="!ids.isEmpty()" 树枝节点
        -- AND id IN  叶子节点
        -- <foreach item="list" ..... 树枝节点
            -- #{item} 叶子节点
```
那么这种情况下是很适合用组合模式,因此Mybatis抽象出`SqlNode`接口暴露给客户端
```java
public interface SqlNode {
  boolean apply(DynamicContext context);
}
```
其有如下子类(子类太多,省略了一些),按照这些子类再翻译下上面的sql
![](http://res.mrdear.cn/1522562685.png)
```txt
-- select  MixedSqlNode
    -- select  StaticTextSqlNode
    -- <include refid="RM-CLASSROOM-ALLCOLS"/> StaticTextSqlNode
    -- where status = 1 StaticTextSqlNode
    -- <if test="!ids.isEmpty()" IfSqlNode 内部的contents为MixedSqlNode
        -- AND id IN  StaticTextSqlNode
        -- <foreach item="list" ..... ForEachSqlNode 内部的contents为MixedSqlNode
            -- #{item} StaticTextSqlNode
```
![](http://res.mrdear.cn/1522563076.png)

从结构上来说,非叶子节点,例如`IfSqlNode`,`ForEachSqlNode`是可以一直嵌套的,所实现的关键就是`SqlNode`接口与`MixedSqlNode`实现类.
从客户端角度来说里面的节点这些都是不关心的,其只需要拿到`SqlNode rootSqlNode`实例,然后调用下`rootSqlNode.apply(context)`即可获取到自己想要的sql原型.
这两个也是组合模式要解决的问题.

## SpringMVC中的组合模式
SpringMVC中对参数的解析使用的是`HandlerMethodArgumentResolver`接口,该类有一个实现类为`HandlerMethodArgumentResolverComposite`,该类为一个组合类,其结构如下:
![](http://res.mrdear.cn/1524061073.png)
其本身实现了`HandlerMethodArgumentResolver`接口,又持有其他`HandlerMethodArgumentResolver`对象,那么这种设计就是组合模式设计.,在它的实现方法中是对其他组合模式中的节点进行循环处理,从而选择最适合的一个.
```java
private HandlerMethodArgumentResolver getArgumentResolver(MethodParameter parameter) {
  HandlerMethodArgumentResolver result = this.argumentResolverCache.get(parameter);
  if (result == null) {
    // 对其所拥有的对象循环,找到最适合处理的一个
    for (HandlerMethodArgumentResolver methodArgumentResolver : this.argumentResolvers) {
      if (methodArgumentResolver.supportsParameter(parameter)) {
        result = methodArgumentResolver;
        break;
      }
    }
  }
  return result;
}
```
对于`HandlerMethodArgumentResolver`来说,其虽然拥有众多子类,但是对于调用方来说却只关心参数所解析的结果,它并不知道该使用哪一个具体的子类,它所希望的是能以整体的形式去访问这些子类,从而选择最适合自己的一个参数解析器.那么`HandlerMethodArgumentResolverComposite`在这里扮演的就是一个整体的角色,对客户端来说调用的是这个整体.

## Netty中的组合模式
Netty中的`CompositeByteBuf`使用了组合设计模式，但是其有点特殊，Netty所描述的零拷贝是应用层面上不做任意的数据复制，而是使用组合的方式拷贝，比如有两个Buf，`headByteBuf`与`tailByteBuf`，那么现在的需求是把两个合在一起，很自然的想到先创建一个新的buf，然后把`headByteBuf`复制进去，再把`tailByteBuf`复制进去，这个过程中涉及到两次应用层面的拷贝，自然不是高效的做法，那么`CompositeByteBuf`的实现是什么样子的呢？

`CompositeByteBuf`的意思是组合，他所采取的方式是把`headByteBuf`与`tailByteBuf`组合起来，对外相当于一个新的Buf，这样的方式不会产生任何应用层面的数据拷贝，原理如下示意图所示：
![](http://res.mrdear.cn/1531922378.png)

那么这也是一种组合设计模式的思想，更可以说是一种妙用。

## 安全性与透明性

**透明性**
所谓的透明性是客户在使用组合模式对象时不需要关心这个节点到底是根还是树枝或者是叶子,对于自己来说都是组件对象,只需要获取一个起始点就能拿到自己想要的东西,所谓的透明性表现在接口中暴露出了所有节点的公共方法,比如添加子节点,移除子节点等,那么就必然会存在叶子节点的添加子节点功能不支持的情况,此时调用应该抛出`UnsupportedOperationException`.
举个反例Mybatis中客户只需要拿到`SqlNode rootSqlNode`就可以获取到想要的sql,对于客户端唯一的入口就是这个`rootSqlNode.apply(context)`获取到对应的sql,客户端本身无法修改这个节点.那么这种行为是非透明的.

**安全性**
非透明性实现一般就是安全性的实现,所谓的安全性保证就是一旦节点构建完毕,客户端就无法更改,只需要获取到自己想要的东西就好.`SqlNode`就是一种安全性的实现,所谓的安全性表现在`SqlNode`接口中没有暴露修改的方法,节点是在构造阶段就组装完毕的.

具体选择哪种,需要根据业务来定夺,如果是类似Mybatis这种先准备好所有数据再执行的模式,那么安全性实现则是最好的选择.如果是业务处理模式下边处理边构造,则透明性最佳.

## 总结
1. 组合模式在于结构上的统一,对外接口的一致,给客户端提供更加统一或者只提供必要的操作.
2. 组合模式是面向接口编程的思想体现,通过接口实现客户端的操作便捷与约束,同时实现更加灵活的自由组合.


