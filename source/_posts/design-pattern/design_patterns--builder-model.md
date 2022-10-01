---
title: 设计模式--Builder模式的思考
subtitle: 关于Builder模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计之道.
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-builder
date: 2018-03-06 12:03:32
updated: 2019-02-14 21:53:00
---
<!-- toc -->
- - - - -
在日常开发中总是会遇到多参数的情况,那么对于多参数,尤其是可选参数众多的情况,可能有如下的一些解决方案.

## 重叠构造器模式
重叠构造器模式在Java代码中很常见,其解决的问题是参数过多情况下又不想给调用方带来过多的实例化对象负担.在这种情况下调用方只需要选择一个适合自己的构造函数调用就好.
```java
  public Configuration(Integer maxConnect) {
    this(maxConnect, 0);
  }

  public Configuration(Integer maxConnect, Integer minConnect) {
    this("default", maxConnect, minConnect);
  }

  public Configuration(String password, Integer maxConnect, Integer minConnect) {
    this(...)
  }
```
然而事实总不是那么如人所愿,这个模式有很多缺点.
1. 层层嵌套,导致整个实例化过程其实是一条直线,一通到底,也就注定了其过程不够灵活.
2. 对于参数较少的构造函数不得不弄一堆的默认值填充,导致其看起来不是很优雅.
3. 增加参数对于这种模式无疑是困难重重,需要从底到上一层一层修改.

## 工厂模式
工厂模式本意在于封装具体的创建流程,提供出简单便捷的入口,但是在多参数情况下其能改进的只是让实例化过程不再是一条直线,工厂中可以根据具体参数制造出`Configuration`及其子类.其本质与重叠构造器模式并没有太大的区别,只是把构造器逻辑提取到相应工厂,所以工厂模式并不能解决上述问题.
```java
 public static Configuration newInstance(String password) {
    return new Configuration("default", password, "default");
  }

  public static Configuration newInstance(String password, String username) {
    return new Configuration(username, password, "default");
  }

  public static Configuration newInstance(String password, String username, String url,) {
    return new Configuration(username, password, url);
  }
```

## JavaBean模式
严格的JavaBean是只有空构造函数,其他属性一律使用set方法,当然必要参数可以放在构造函数中,那么就变成下面的这种形式.
```java
    Configuration configuration = new Configuration();
    configuration.setPassword("default");
    configuration.setUrl("http://mrdear.cn");
    configuration.setUsername("default");
```
虽然少了冗长的参数列表,但是缺点也是很明显:
1. 对象的创建过程被分解,按照意图,new的过程就是创建,剩下的一律不算创建,但这种模式下的创建实际上是两步,创建与填值.
2. 对修改开放,该模式暴露了过多set方法,使得任意能获取到该实例的地方都可以随意修改器内容,对于全局性的config实例或者其他单例实例这是致命的缺点.

## Builder模式
有句话说得好,遇到难以解决的问题就加一层中间层来代理抽象.**Builder**模式正式如此,对象本身创建麻烦,那么就使用一个代理对象来主导创建与检验,兼顾了重叠器模式的安全性以及JavaBean模式的灵活性.
```java
public class Configuration {
  private String username;
  private String password;
  private String url;

  public Configuration(String username, String password, String url) {
    this.username = username;
    this.password = password;
    this.url = url;
  }

  public static ConfigurationBuilder builder() {
    return new ConfigurationBuilder();
  }

  public static class ConfigurationBuilder {
    private String username;
    private String password;
    private String url;

    ConfigurationBuilder() {
    }

    public ConfigurationBuilder username(String username) {
      this.username = username;
      return this;
    }

    public ConfigurationBuilder password(String password) {
      this.password = password;
      return this;
    }

    public ConfigurationBuilder url(String url) {
      this.url = url;
      return this;
    }

    public Configuration build() {
      // can some check
      return new Configuration(this.username, this.password, this.url);
    }

    public String toString() {
      return new StringBuilder().append((String)"Configuration.ConfigurationBuilder(username=").append((String)this.username).append((String)", password=").append((String)this.password).append((String)", url=").append((String)this.url).append((String)")").toString();
    }
  }
}
```
如上面代码,客户端使用Builder对象选择必要的参数,然后最后build()构建出自己想要的参数.Builder有很多优势,也很灵活:
1. 把线性的构造结构用`build`方法变成了分支结构,你可以使用build构造该类的子类以及其他相关类.
2. 很灵活,组合的形式可以在各自builder加强约束校验,并且这些业务逻辑不会在污染你的原类.当不符合的参数应及时抛出`IllegalArgumentException`
3. 可作为参数传递,比如Mybatis中就大量使用了这种传递方式让客户端更加方便的构造配置类.
4. 使用`.filed()`形式构建参数,只要命名有一定规范,就很清楚参数的作用,编写出来的代码也更加容易阅读,不用点进去看具体参数来选择适合自己的方法了.

当然缺点也有:
1. 构造想要的类之前必须构造一个builder中间类,对于一些经常循环中实例化的类是很不适合的.大量对象被重复创建会带来性能上的影响.因此对于一些复杂的配置类使用builder时最合适不过的了.

## Mybatis中Builder模式应用
Mybatis拥有种类繁多的配置,那么builder就很适合其配置类对象,以`MappedStatement`类为例子.
`MappedStatement`拥有数十项配置,如果使用构造函数或者静态工厂那么对于开发人员可能是难以接受的体验.一大堆参数,还需要点进去才能知道每一个参数的意义,在这样的情况下Builder模式就是一个很好的解决方式.
```java
public final class MappedStatement {

  private String resource;
  private Configuration configuration;
  private String id;
  private Integer fetchSize;
  private Integer timeout;
  private StatementType statementType;
  private ResultSetType resultSetType;
  private SqlSource sqlSource;
    ......
}
```
`org.apache.ibatis.mapping.MappedStatement.Builder`作为`MappedStatement`的静态内部类,拥有可以访问`MappedStatement`任意属性的权利.那么其就可以直接实例化`mappedStatement`对象,然后使用该对象直接访问属性,从而简化Builder模式,也很好的创建出`MappedStatement`的实例.
```java
  public static class Builder {
    private MappedStatement mappedStatement = new MappedStatement();

    public Builder(Configuration configuration, String id, SqlSource sqlSource, SqlCommandType sqlCommandType) {
      mappedStatement.configuration = configuration;
      mappedStatement.id = id;
      mappedStatement.sqlSource = sqlSource;
      mappedStatement.statementType = StatementType.PREPARED;
      mappedStatement.parameterMap = new ParameterMap.Builder(configuration, "defaultParameterMap", null, new ArrayList<ParameterMapping>()).build();
      mappedStatement.resultMaps = new ArrayList<ResultMap>();
      mappedStatement.sqlCommandType = sqlCommandType;
      mappedStatement.keyGenerator = configuration.isUseGeneratedKeys() && SqlCommandType.INSERT.equals(sqlCommandType) ? Jdbc3KeyGenerator.INSTANCE : NoKeyGenerator.INSTANCE;
      String logId = id;
      if (configuration.getLogPrefix() != null) {
        logId = configuration.getLogPrefix() + id;
      }
      mappedStatement.statementLog = LogFactory.getLog(logId);
      mappedStatement.lang = configuration.getDefaultScriptingLanguageInstance();
    }

    public Builder resource(String resource) {
      mappedStatement.resource = resource;
      return this;
    }
    ......
}
```

另外为了保证`MappedStatement`对象必须使用Builder来控制,代码中把其构造函数声明为包级别权限
```java
  MappedStatement() {
    // constructor disabled
  }
```

## 总结
Builder模式本质上是一种特殊的工厂模式,把对象的创建拆解为多个子流程，最后再统一创建目标对象,在这之间各个子流程之间可以任意组合,达到了高度的灵活性，但是由于每次创建都会产生两次对象，实际上对于内存是不友好的方式，因此如果是一个频繁调用的场景下，使用Builder模式则需要根据业务场景斟酌了。

## 参考
Effective Java : 遇到多个构造器参数时考虑构建器(Builder模式)