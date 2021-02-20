---
title: Mybatis源码分析(四)--TypeHandler的解析
subtitle: 源码分析TypeHandler在Mybatis中是如何作为通用的数据转换器.
cover: http://imgblog.mrdear.cn/mybatis.png
author: 
  nick: 屈定
tags:
  - Mybatis
categories:  框架与中间件
urlname: framework-mybatis-type-handler
date: 2017-12-15 23:14:45
updated: 2017-12-15 23:14:46
---
### 学习前的疑问
1. TypeHandler的主要功能是什么?
2. TypeHandler如何配置?
3. Mybatis是如何使用TypeHandler?(参数设置,结果映射)
4. 实现通用枚举转换器的可行方案是什么?

### TypeHandler的主要功能是什么?
`TypeHandler`是一个接口,那么其所拥有什么功能最简单的方法是看接口方法与注释(这里mybatis注释相当少),那么看下列方法.
1.`void setParameter(PreparedStatement ps, int i, T parameter, JdbcType jdbcType) throws SQLException;`
该方法为设置参数使用的转换方法,所需要的参数基本都给你传过来了,因此很好理解.
2.`T getResult(ResultSet rs, String columnName) throws SQLException;`
该方法是拿到结果集后根据列名称处理结果
3.`T getResult(ResultSet rs, int columnIndex) throws SQLException`
该方法是拿到结果集后根据列序号处理结果
4.`T getResult(CallableStatement cs, int columnIndex) throws SQLException;`
该方法是针对存储过程转换结果.

那么`TypeHandler`的作用就可以简单的理解为: 
1. **转换参数到sql中**
2. **转换查询结果到Java类中**

### TypeHandler如何配置?

#### 1.系统默认转换器
TypeHandler有一个注册工厂为`TypeHandlerRegistry`类,该类中默认初始化了常用的转换器,其成员变量中有如下两个Map,可以看到`JDBC_TYPE_HANDLER_MAP`该map是针对jdbc转换到Java类的转换,为一对一结构,`TYPE_HANDLER_MAP`该map是针对Java类到JDBC类型的转换,为一对多结构.
```java
private final Map<JdbcType, TypeHandler<?>> JDBC_TYPE_HANDLER_MAP = new EnumMap<JdbcType, TypeHandler<?>>(JdbcType.class);
  private final Map<Type, Map<JdbcType, TypeHandler<?>>> TYPE_HANDLER_MAP = new ConcurrentHashMap<Type, Map<JdbcType, TypeHandler<?>>>();
```

以String类的转换器注册为例分析下
```java
    register(String.class, new StringTypeHandler());
    register(String.class, JdbcType.CHAR, new StringTypeHandler());
    register(String.class, JdbcType.CLOB, new ClobTypeHandler());
    register(String.class, JdbcType.VARCHAR, new StringTypeHandler());
    register(String.class, JdbcType.LONGVARCHAR, new ClobTypeHandler());
    register(String.class, JdbcType.NVARCHAR, new NStringTypeHandler());
    register(String.class, JdbcType.NCHAR, new NStringTypeHandler());
    register(String.class, JdbcType.NCLOB, new NClobTypeHandler());
    register(JdbcType.CHAR, new StringTypeHandler());
    register(JdbcType.VARCHAR, new StringTypeHandler());
    register(JdbcType.CLOB, new ClobTypeHandler());
    register(JdbcType.LONGVARCHAR, new ClobTypeHandler());
    register(JdbcType.NVARCHAR, new NStringTypeHandler());
    register(JdbcType.NCHAR, new NStringTypeHandler());
    register(JdbcType.NCLOB, new NClobTypeHandler());
```
那么对应的**JDBC_TYPE_HANDLER_MAP**内存里面为
![](http://imgblog.mrdear.cn/1513402348.png?imageMogr2/thumbnail/!70p)
**TYPE_HANDLER_MAP**内存里面接口如下图,注意在其`TypeHandler`中有一个key为null的转换器,其对应的注册方法自然为` register(String.class, new StringTypeHandler());`,那么也就是说当没指定jdbc类型时对于String.class类的转换均使用该转换器作为默认的`TypeHandler`.
![](http://imgblog.mrdear.cn/1513402290.png?imageMogr2/thumbnail/!70p)

#### 2.mybatis.type-handlers-package转换器
该指令是配置一个转换器所在的包,然后扫描该包下的`TypeHandler`的实现类,自动注册为转换器,详情可以看`org.apache.ibatis.type.TypeHandlerRegistry#register(java.lang.String)`方法
由于Java存在泛型擦除机制,那么该Handler针对的JavaType该方法从`TypeHandler`实现类是拿不到的,因此其需要配合`MappedTypes`注解,看如下实现方法,针对`TypeHandler`去主动获取其上的`MappedTypes`注解,使用注解中的JavaType作为该`TypeHandler`的转换主体,如果获取不到则使用null,因此需要额外注意.
```java
 public void register(Class<?> typeHandlerClass) {
    boolean mappedTypeFound = false;
    MappedTypes mappedTypes = typeHandlerClass.getAnnotation(MappedTypes.class);
    if (mappedTypes != null) {
      for (Class<?> javaTypeClass : mappedTypes.value()) {
        register(javaTypeClass, typeHandlerClass);
        mappedTypeFound = true;
      }
    }
    if (!mappedTypeFound) {
      register(getInstance(null, typeHandlerClass));
    }
  }
```

#### 3.Mapper中定义的TypeHandler
首先我定义一个自定义的`TypeHandler`,该Handler只针对我所定义的枚举类处理,当然只能处理`UserIdentifyType`枚举类型,后面会实现一个通用的枚举转换器.
```java
public class UserIdentifyTypeHandler extends BaseTypeHandler<UserIdentifyType> {
  @Override
  public void setNonNullParameter(PreparedStatement ps, int i, UserIdentifyType parameter, JdbcType jdbcType) throws SQLException {
    ps.setInt(i, parameter.getValue());
  }
  @Override
  public UserIdentifyType getNullableResult(ResultSet rs, String columnName) throws SQLException {
    return UserIdentifyType.of(rs.getInt(columnName));
  }
  @Override
  public UserIdentifyType getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
    return UserIdentifyType.of(rs.getInt(columnIndex));
  }
  @Override
  public UserIdentifyType getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
    return UserIdentifyType.of(cs.getInt(columnIndex));
  }
}
```
然后在mapper.xml文件中也是可以定义`TypeHandler`的,如下形式
```java
<select id="findByOpenIdAnyType" resultType="com.itoolshub.user.repository.domain.UserAuth">
		SELECT <include refid="RM-USERAUTH-ALLCOLS"/>
		FROM user_auth
		WHERE status = 1 AND openid = #{openId} AND identity_type = #{type,typeHandler=com.itoolshub.user.convert.UserIdentifyTypeHandler}
	</select>
```
那么这个`TypeHandler`是什么时候初始化的呢?
这里涉及到`ParameterMapping`这个类,该类是Mybatis存储参数映射的地方,其内部有方法`org.apache.ibatis.builder.BaseBuilder#resolveTypeHandler(java.lang.Class<?>, java.lang.Class<? extends org.apache.ibatis.type.TypeHandler<?>>)`,该方法会获取到对应的`TypeHandler`,然后从`typeHandlerRegistry`中获取,获取不到则使用反射生成一个.**生成后并没有加入到typeHandlerRegistry中,也就是该TypeHandler并非单例,多少个sqlStament中如果使用了该转换器那么就会实例化几个该转换器**,因此正确的使用方法是把该`TypeHandler`注册到`typeHandlerRegistry`中,然后在xml中使用.那么针对上述sql的`ParameterMapping`如下.
另外由于我没有在xml中指定JavaType,那么其默认为Object,也就是参数设置是不能动态获取参数类型的.
![](http://imgblog.mrdear.cn/1513414409.png?imageMogr2/thumbnail/!70p)

### 参数如何使用TypeHandler设置到sql中?
上面说到对于每一个sqlSatment都会解析为一个ParameterMapping的Map集合,在该`ParameterMapping`中TypeHandler已经确定好了,那么设置参数就只需要简单的调用下`typeHandler.setParameter(ps, i + 1, value, jdbcType);`方法,具体可以参考`org.apache.ibatis.scripting.defaults.DefaultParameterHandler#setParameters`方法中对其的做法.
这里有一个很重要的点就是这里的`TypeHandler`的选择没有和我传入的参数类型绑定,举个例子我把上述参数去掉typehandler变成`identity_type = #{type}`,那么得到的则是一个`UnknownTypeHandler`.
![](http://imgblog.mrdear.cn/1513423812.png?imageMogr2/thumbnail/!70p)

#### UnknownTypeHandler并不Unknow
`UnknownTypeHandler`的实现中能获取到具体输入参数的类型,然后调用`org.apache.ibatis.type.UnknownTypeHandler#resolveTypeHandler(java.lang.Object, org.apache.ibatis.type.JdbcType)`方法从`TypeHandlerRegistry`中获取到真正的转换器,这里的获取是根据输入参数的具体类型的class名称.获取不到则使用`ObjectTypeHandler`作为转换器.

### 结果如何使用TypeHandler设置到结果集中?
相比参数设置结果的取出转换要复杂很多,方法`org.apache.ibatis.executor.resultset.ResultSetWrapper#getTypeHandler`中定义了一系列的获取`TypeHandler`的策略,总结如下顺序
1. 根据返回参数类型+jdbc类型
2. 根据返回参数类型
3. 根据jdbc类型
具体就不展开讨论了.

### 制作通用的枚举类处理器
依照上述分析,如果想让枚举类的处理和基本类型一样的不需要显示的在mapper.xml上指定一些属性,几乎是不可能的一件事情,不过可以大大简化其使用方式,首先分析下对于枚举类两处的处理.
1. 参数设置时,mapper.xml中的sql字段什么都不指定直接#{value},那么最终会使用该value的**class名称**去获取到对应的typeHandler.
2. 结果映射时,由上述优先级顺序可以得知对于枚举类会使用方式2**根据返回参数类型,也就是class名称**获取对应的typeHandler.

那么通用转换器的实现思路很简单了,要做的就是把对应枚举类的名称->typehandler初始化时注入到`TypeHandlerRegistry`中.首先定义一个枚举类所使用的接口,然后编写通用处理,这里能实现还一个原因就是Class对象有`type.getEnumConstants()`方法可以获取到其所有枚举对象,也就是可以把数字映射为指定结果了,需要注意的是这里把每个枚举类都注入到`TypeHandlerRegistry`使用的是`@MappedTypes`注解,该注解生效是需要配置`mybatis.type-handlers-package`以包的形式扫,否则不生效.

下面的代码是copy自github,本文算是对其原理分析了一遍.[https://github.com/mybatis/mybatis-3/issues/42](https://github.com/mybatis/mybatis-3/issues/42)
**EnumHasValue**
```java
public interface EnumHasValue {
  int getValue();
}
```
**EnumValueTypeHandler**
```java
@MappedTypes({UserIdentifyType.class, UserRoleType.class})
public class EnumValueTypeHandler<E extends Enum<E> & EnumHasValue> extends BaseTypeHandler<E>{

  private Class<E> type;
  private final E[] enums;

  public EnumValueTypeHandler(Class<E> type) {
    if (type == null) {
      throw new IllegalArgumentException("Type argument cannot be null");
    }
    this.type = type;
    this.enums = type.getEnumConstants();
    if (this.enums == null) {
      throw new IllegalArgumentException(type.getSimpleName() + " does not represent an enum type.");
    }
  }

  @Override
  public void setNonNullParameter(PreparedStatement ps, int i, E parameter, JdbcType jdbcType) throws SQLException {
    ps.setInt(i,parameter.getValue());
  }

  @Override
  public E getNullableResult(ResultSet rs, String columnName) throws SQLException {
    int value = rs.getInt(columnName);
    if (rs.wasNull()) {
      return null;
    }
    for (E enm : enums) {
      if (value == enm.getValue()) {
        return enm;
      }
    }
    throw new IllegalArgumentException("Cannot convert " + value + " to " + type.getSimpleName());
  }

  @Override
  public E getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
    int value = rs.getInt(columnIndex);
    if (rs.wasNull()) {
      return null;
    }
    for (E enm : enums) {
      if (value == enm.getValue()) {
        return enm;
      }
    }
    throw new IllegalArgumentException("Cannot convert " + value + " to " + type.getSimpleName());
  }

  @Override
  public E getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
    int value = cs.getInt(columnIndex);
    if (cs.wasNull()) {
      return null;
    }
    for (E enm : enums) {
      if (value == enm.getValue()) {
        return enm;
      }
    }
    throw new IllegalArgumentException("Cannot convert " + value + " to " + type.getSimpleName());
  }
}

```

### 备注
以上内容基于 `mybatis-spring-boot-starter`:1.3.0,其`mybatis`版本3.4.4

参考文章: [http://www.mybatis.org/mybatis-3/zh/configuration.html#typeHandlers](http://www.mybatis.org/mybatis-3/zh/configuration.html#typeHandlers)