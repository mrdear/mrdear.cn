---
title: Mybatis源码分析(三)--动态Sql中的参数解析
subtitle: 分析对于输入参数Mybatis是如何映射到xml中.
cover: http://imgblog.mrdear.cn/mybatis.png
author: 
  nick: 屈定
tags:
  - Mybatis    
categories: 框架与中间件
urlname: framework-mybatis-sql-analysis
date: 2017-09-10 11:45:04
updated: 2017-09-10 11:45:04
---
Mybatis中参数解析对于开发人员来说是至关重要的,不然很容易出小问题,举个例子,假设现在方法为,当然这个是很糟糕的写法,这里只是想要搞清楚参数如何解析,项目中万万不可这样写.
### 参数输入解析
```java
    //方法
    User findUser(@Param("name") String name,int age,String email)
    //对应xml
	<select id="findUser" resultType="cn.mrdear.users.dao.User">
		SELECT * FROM user WHERE username = #{name} AND age = #{age} AND email = #{email} 
	</select>
	//调用参数
    final User user = userMapper.findUser("quding", 18, "qq@mail.com");
```
那么这里Mybatis会怎么解析参数呢?这个xml会构造失败不?首先是`MapperMethod`中使用`ParamNameResolver`对输入参数解析,针对上述输入参数会得到下面的结果.
```java
 public ParamNameResolver(Configuration config, Method method) {
    final Class<?>[] paramTypes = method.getParameterTypes();//获取参数类型,对于上述例子则是String,int,String
    final Annotation[][] paramAnnotations = method.getParameterAnnotations();//这里获取到的则是@Param,getParameterAnnotations方法也用到了动态代理.
    final SortedMap<Integer, String> map = new TreeMap<Integer, String>();
    int paramCount = paramAnnotations.length;
    // get names from @Param annotations
    for (int paramIndex = 0; paramIndex < paramCount; paramIndex++) {
      if (isSpecialParameter(paramTypes[paramIndex])) { //过滤其内部一些特殊类型
        // skip special parameters
        continue;
      }
      String name = null;
      for (Annotation annotation : paramAnnotations[paramIndex]) {
        if (annotation instanceof Param) {
          hasParamAnnotation = true;
          name = ((Param) annotation).value();//获取到'name'值
          break;
        }
      }
      if (name == null) {
        // @Param was not specified.
        if (config.isUseActualParamName()) {//默认为true,因此编译后参数都是args0,args1之类,因此这里获取的也是args0...
          name = getActualParamName(method, paramIndex);
        }
        //当上面配置为false的时候这里才会使用0,1代替,因此如果未开启则会报错
        if (name == null) {
          // use the parameter index as the name ("0", "1", ...)
          // gcode issue #71
          name = String.valueOf(map.size());//上述都没的话则世界使用map的index.
        }
      }
      map.put(paramIndex, name);
    }
    names = Collections.unmodifiableSortedMap(map);
  }
```
那么执行完毕后对于上述例子,names里面如下图所示,由于`config.isUseActualParamName()`为true,所以#{0}这种写法这里并不支持,而且也不建议这种写法,无可读性.
![](http://imgblog.mrdear.cn/1504965737.png?imageMogr2/thumbnail/!120p)
接下来执行`method.convertArgsToSqlCommandParam(args)`获取到实际输入的参数,对于上面例子我获取到的是个Map集合,如下图所示,对于单一实体例如User那么获取到的就是该实体.
![](http://imgblog.mrdear.cn/1505017418.png?imageMogr2/thumbnail/!120p)
再看我所用的sql写法,那么这里只能获取到name的值,sql处理时就会报错.
```xml
SELECT * FROM user WHERE username = #{name} AND age = #{age} AND email = #{email} 
```
**由此可见针对多参数的输入**,最佳解决方案是用`@Param`注解,其次为使用Map集合包裹参数,这样的话`method.convertArgsToSqlCommandParam(args)`得到的则是该Map集合.

### 动态sql渲染解析
上述流程能得到所有的输入参数,那么接下来就是对sql的解析,下面把我们的sql变得复杂一些.(不要讨论sql的意义...这里只是分析参数如何解析)
```java
//mapper接口
  User findUser(@Param("name") String name, @Param("user") User user,@Param("ids") List<Long> ids);
//xml
    <select id="findUser" resultType="cn.mrdear.users.dao.User">
		SELECT * FROM user WHERE username = #{name} AND age = #{user.age} AND email = #{user.email}
		OR id in
		<foreach collection="ids" item="item" open="(" close=")" separator=",">
			#{item}
		</foreach>
	</select>
```
按照上述流程Mybatis解析出来的输入参数如下图
![](http://imgblog.mrdear.cn/1505020777.png?imageMogr2/thumbnail/!100p)

接下进入`DefaultSqlSession`的处理中,在其中有如下方法会多参数进一步判断,可以看出对于单一参数为`Collection`或者`Array`时Mybatis都会给默认命名方案.(这里是在3.3.0之前的版本只会处理List)
```java
  private Object wrapCollection(final Object object) {
    if (object instanceof Collection) {
      StrictMap<Object> map = new StrictMap<Object>();
      map.put("collection", object);
      if (object instanceof List) {
        map.put("list", object);
      }
      return map;
    } else if (object != null && object.getClass().isArray()) {
      StrictMap<Object> map = new StrictMap<Object>();
      map.put("array", object);
      return map;
    }
    return object;
  }
```
到了接下来转到执行器,使用`DynamicContext`构造动态sql所需要的上下文,对其构造函数分析
执行到这里的话参数只有三种情况
1. null,无任何参数传入
2. Map类型，对于多参数,或者参数本身就是map再或者输入单一参数集合类型,数组类型都会转换为map
3. 单一POJO类型.
Mybatis这里要做的就是把参数的各种形式尽可能都放在`ContextMap`中,该`ContextMap`是绑定了Ognl的,方便Ognl直接从其中获取到值.
```java
  public DynamicContext(Configuration configuration, Object parameterObject) {
    if (parameterObject != null && !(parameterObject instanceof Map)) {
      MetaObject metaObject = configuration.newMetaObject(parameterObject);
      //对于单个输入数据直接保存在ContentMap中
      bindings = new ContextMap(metaObject);
    } else {
      bindings = new ContextMap(null);
    }
    //输入参数形式为 _parameter  : parameterObject
    bindings.put(PARAMETER_OBJECT_KEY, parameterObject);
    bindings.put(DATABASE_ID_KEY, configuration.getDatabaseId());
  }
```
![](http://imgblog.mrdear.cn/1505023031.png?imageMogr2/thumbnail/!70p)

#### SqlNode
SqlNode是动态Sql解析和完善`ContextMap`的地方,对于我上述sql会转换为其三个子类,相关解析方法都在其内部.
![](http://imgblog.mrdear.cn/1505027107.png?imageMogr2/thumbnail/!70p)
解析后的sql如下图
```sql
SELECT * FROM user WHERE username = ? AND age = ? AND email = ?
		OR id in (  ?, ?, ?)
```
此时`ContextMap`如下,其中有`_frch_item_2`这种形式的参数,这是Mybatis对foreach解析后所生成的键,便于填充数据,具体可以看`ForeachSqlNode`
![](http://imgblog.mrdear.cn/1505027407.png?imageMogr2/thumbnail/!100p)
那么接下来要做的事情就是一一设置进去这些值.

#### ParameterHandler
顾名思义,其提供`void setParameters(PreparedStatement ps)`对于sql参数设置的处理.分析下`DefaultParameterHandler`
```java
 @Override
  public void setParameters(PreparedStatement ps) {
    ErrorContext.instance().activity("setting parameters").object(mappedStatement.getParameterMap().getId());
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    if (parameterMappings != null) {
        //parameterMappings存储着要设置进去的值类型等信息
      for (int i = 0; i < parameterMappings.size(); i++) {
        ParameterMapping parameterMapping = parameterMappings.get(i);
        if (parameterMapping.getMode() != ParameterMode.OUT) {
          Object value;
          String propertyName = parameterMapping.getProperty();
          //AdditionalParameter是从ContextMap中copy到的,其没有的话说明是_parameter里面的值.
          if (boundSql.hasAdditionalParameter(propertyName)) { // issue #448 ask first for additional params
            value = boundSql.getAdditionalParameter(propertyName);
          } else if (parameterObject == null) {
            value = null;
          } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
            value = parameterObject;
          } else {
              //获取_parameter里面的值.
            MetaObject metaObject = configuration.newMetaObject(parameterObject);
            //其内部是一个递归实现获取.
            value = metaObject.getValue(propertyName);
          }
            //typeHandle的处理
          TypeHandler typeHandler = parameterMapping.getTypeHandler();
          JdbcType jdbcType = parameterMapping.getJdbcType();
          if (value == null && jdbcType == null) {
            jdbcType = configuration.getJdbcTypeForNull();
          }
          try {
            typeHandler.setParameter(ps, i + 1, value, jdbcType);
          } catch (TypeException e) {
            throw new TypeException("Could not set parameters for mapping: " + parameterMapping + ". Cause: " + e, e);
          } catch (SQLException e) {
            throw new TypeException("Could not set parameters for mapping: " + parameterMapping + ". Cause: " + e, e);
          }
        }
      }
    }
  }
```
那么看`MetaObject`的递归获取,递归是针对参数为`user.username`这样的话会先从`_parameter`中找到user,然后再调用user 的getUsername()方法获取到结果.
```java
  public Object getValue(String name) {
    PropertyTokenizer prop = new PropertyTokenizer(name);
    //hasNext判断user.username这种类型
    if (prop.hasNext()) {
      MetaObject metaValue = metaObjectForProperty(prop.getIndexedName());
      if (metaValue == SystemMetaObject.NULL_META_OBJECT) {
        return null;
      } else {
          //递归获取
        return metaValue.getValue(prop.getChildren());
      }
    } else {
      return objectWrapper.get(prop);
    }
  }
```
那么针对上面的例子,这里先是去boundSql中的addtionParameters中获取参数,该参数一般是sql解析时动态生成的,比如foreach生成的_frch_xx,获取不到的话再去原始的ParamsObject中获取,该处的解析为递归形式了.
![](http://imgblog.mrdear.cn/1505526788.png?imageMogr2/thumbnail/!70p)

### 总结
Mybatis的SQL解析总体流程如下:
1. 构造ParamtersMap,保存输入参数.
2. 构造ContextMap,为OGNL解析提供数据.
3. 读取xml.使用SqlSource与SqlNode解析xml中的sql,设置参数值到boundSql的addtionParameters中,其为ContextMap的一个副本.
4. 根据`boundSql.parameterMappings`获取到参数,从`addtionParameters`与`ParamtersMap`中读取参数设置到`PreparedStatement`中
5. 执行sql
本文只分析了总体流程,其中有很多细节都忽略了,如遇到问题再看也不迟.






