---
title: Mybatis源码分析(二)--Sqlsession的执行流程
subtitle: Mybatis中Sqlsession管理下的sql执行器是如何工作的?
cover: http://res.mrdear.cn/mybatis.png
author: 
  nick: 屈定
tags:
  - Mybatis    
categories: 框架与中间件
urlname: framework-mybatis-sql-session
date: 2017-09-09 19:49:52
updated:  2017-09-09 19:49:52
---
上一篇Mapper动态代理中发现Mybatis会对Mapper接口的方法转向`mapperMethod.execute(sqlSession, args)`,那么该篇就学习Mybatis对于sql的执行总体流程,文章不会涉及很多细节点,重点学习其设计以及这样做的理由.
- - - - -
### SqlCommand
`SqlCommand`是`MapperMethod`的一个内部类,其封装着要执行sql的id(xml的namespace+方法名)与类型(select,insert等),这些都是从`MappedStatement`中获取到,`MappedStatement`是mybatis初始化读取xml时所构造的对象,具体可以参考之前的文章.对于一个确定的Mapper接口中方法来说这个是确定的值.还有这里有些人认为是命令模式,我认为不是,这里只是该方法对应sql的唯一标识的体现,从下面代码Mybatis对其的使用来看,也不是命令模式具有的行为,而对于命令的执行实际上是`sqlSession`来执行的,而命令模式的要求是命令中封装委托对象,调用其excute()把任务交给委托执行的对象.
**Mybatis对sqlCommand的使用**
```java
public Object execute(SqlSession sqlSession, Object[] args) {
    Object result;
    switch (command.getType()) {
      case INSERT: {
    	Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.insert(command.getName(), param));
        break;
      }
      case UPDATE: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.update(command.getName(), param));
        break;
      }
      ...............
```
### MethodSignature与ParamNameResolver
`MethodSignature`也是`MapperMethod`中的一个内部类对象,其封装着该方法的详细信息,比如返回值类型,参数值类型等,分析该类可以得到Mybatis支持的返回类型有集合,Map,游标等各式各样,还支持自定义结果映射器.
`ParamNameResolver`是用于方法参数名称解析并重命名的一个类,在Mybatis的xml中使用`#{0},#{id}`或者注解`@Param()`等写法都是合法的,为什么合法这个类就是解释,具体的分析过程因为跨度比较长,后面专用一篇文章来分析.

### INSERT,UPDATE,DELETE的结果处理
对于这三种方法的执行,Mybatis会用`rowCountResult()`方法包裹结果,从源码中可以很清楚的看出来Mybatis只支持返回void,Integer,Long,Boolean类型的值,**默认是int类型,这里建议数量查询使用int**.
```java
  private Object rowCountResult(int rowCount) {
    final Object result;
    if (method.returnsVoid()) {
      result = null;
    } else if (Integer.class.equals(method.getReturnType()) || Integer.TYPE.equals(method.getReturnType())) {
      result = rowCount;
    } else if (Long.class.equals(method.getReturnType()) || Long.TYPE.equals(method.getReturnType())) {
      result = (long)rowCount;
    } else if (Boolean.class.equals(method.getReturnType()) || Boolean.TYPE.equals(method.getReturnType())) {
      result = rowCount > 0;
    } else {
      throw new BindingException("Mapper method '" + command.getName() + "' has an unsupported return type: " + method.getReturnType());
    }
    return result;
  }
```
### Select的处理
Select是最复杂的处理,其拥有多样的返回值类型,从源码中可以发现Mybatis支持自定义结果映射器,集合返回,Map返回,游标返回以及单条返回.具体该方法是属于哪一种类型在`MethodSignature`中都有定义,这里不多叙述.
```java
 case SELECT:
        if (method.returnsVoid() && method.hasResultHandler()) {
          executeWithResultHandler(sqlSession, args);
          result = null;
        } else if (method.returnsMany()) {
          result = executeForMany(sqlSession, args);
        } else if (method.returnsMap()) {
          result = executeForMap(sqlSession, args);
        } else if (method.returnsCursor()) {
          result = executeForCursor(sqlSession, args);
        } else {
          Object param = method.convertArgsToSqlCommandParam(args);
          result = sqlSession.selectOne(command.getName(), param);
        }
        break;
```

### SqlSession
上述流程之后,SQL的执行就转交给`SqlSession`,这里会设置参数,去数据库查询,映射结果,可谓是Mybatis的核心.`SqlSession`下有如下四大对象.
1. ParameterHandler: 处理参数设置问题
2. ResultHandler: 结果处理
3. StatementHandler: 负责连接数据库,执行sql
4. Executor: 对上述过程的调度组织.

### Executor的装饰器模式设计
Mybatis的`Executor`的结构如下,目前的Mybatis(3.4.6)在`BaseExecutor`中增加了`protected Executor wrapper`这个内部被装饰对象,其是想往标准的装饰器模式转变.
![](http://res.mrdear.cn/1520503047.png)
其中`CachingExecutor`为二级缓存实现,当在Mybatis Config中配置了`cacheEnabled`才会用其包裹当前的`Executor`,利用类似AOP环绕通知的方式实现缓存.
`BaseExecutor`为基本装饰器,其实现了`Executor`接口,并且内部也持有一个`protected Executor wrapper;`被包装对象.
`SimpleExecutor`为最基本装饰器实现类,提供最基本的增删改查需求.
`BatchExecutor`在原有基础上增加了对批量处理的支持.
`ReuseExecutor`在原有基础上增加了复用SQL功能.

除去上述问题,接下来的执行流程是很清晰的
![](http://res.mrdear.cn/1520504301.png)

### BaseExecutor
```java    
@Override
  public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
    BoundSql boundSql = ms.getBoundSql(parameter);//获取sql,此时还都是?占位符状态的sql    
    CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql); //获取缓存key,根据id,sql,分页参数计算
    return query(ms, parameter, rowBounds, resultHandler, key, boundSql);//跳到下面方法执行
 }

  @SuppressWarnings("unchecked")
  @Override
  public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
    if (closed) {
      throw new ExecutorException("Executor was closed.");
    }
    //queryStack用于延时加载,暂时未研究,若配置不用缓存,则每次查询前清空一级缓存.
    if (queryStack == 0 && ms.isFlushCacheRequired()) {
      clearLocalCache();
    }
    List<E> list;
    try {
      queryStack++;
      //缓存中取出数据,具体会在缓存详解中分析,这里只需要了解具体执行过程
      list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
      if (list != null) {
          //针对存储过程更新参数缓存
        handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
      } else {
          //缓存未中则去查数据库
        list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
      }
    } finally {
      queryStack--;
    }
    //这边是延迟加载的实现,不在本次分析内容中
    if (queryStack == 0) {
      for (DeferredLoad deferredLoad : deferredLoads) {
        deferredLoad.load();
      }
      // issue #601
      deferredLoads.clear();
      if (configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
        // issue #482
        clearLocalCache();
      }
    }
    return list;
  }
```
接下来是DB的查询,DB的查询主要由其子类来实现.
```java
  private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
    //这里先放入缓存中占位符,一级缓存的实现
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
        //调用子类的方法处理,模板方法的体现
      list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
      localCache.removeObject(key);
    }
    //放入查询结果缓存,一级缓存的实现
    localCache.putObject(key, list);
    //存储过程还需要缓存参数
    if (ms.getStatementType() == StatementType.CALLABLE) {
      localOutputParameterCache.putObject(key, parameter);
    }
    return list;
  }
```
### SimpleExecutor
`SimpleExecutor`是真正从数据库查询的地方,查询是要经过`StatementHandler`组织`ParameterHandler`,`ResultHandler`的处理过程,那么`StatementHandler`承担了什么样的角色?
```java
  @Override
  public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
    Statement stmt = null;
    try {
      Configuration configuration = ms.getConfiguration();
      //创建statement
      StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
      //获取连接,设置参数等预处理
      stmt = prepareStatement(handler, ms.getStatementLog());
      //执行查询并映射结果
      return handler.<E>query(stmt, resultHandler);
    } finally {
      closeStatement(stmt);
    }
  }
```
...
篇幅已经过长了,剩下的`StatementHandler`就不太一样了,其是由`RoutingStatementHandler`这个类来转发到具体的执行器中,这个设计就有点迷了,不打算再继续分析了,有兴趣的同学可以自己研究一下.接下来会对一些关键点的实现分析,比如sql的解析,延迟加载的实现等.




