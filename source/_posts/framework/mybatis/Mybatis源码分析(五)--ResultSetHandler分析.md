---
title: Mybatis源码分析(五)--ResultSetHandler分析
subtitle: 这一节主要是学习Mybatis是如何取出结果与对应的ResultMap映射的.
cover: http://res.mrdear.cn/mybatis.png
author: 
  nick: 屈定
tags:
  - Mybatis    
categories: 框架与中间件
urlname: framework-mybatis-result-set-handler
date: 2018-01-14 23:15:45
updated: 2018-01-14 23:15:47
---
<!-- toc -->
- - - - -

### 学习前的疑问
1. Mybatis结果映射有哪几种形式?
2. ResultMap的xml所对应的数据结构是什么?
3. ResultMap是如何构造的,其中包含继承以及`association`,`collection`等标签是如何处理的?
4. ResultMap在`Executor`执行后是怎么对结果处理的?
5. 插入写回主键是如何实现的?支持批量吗?

### Mybatis结果映射有哪几种形式?
简单来说有两种形式,`resultMap`与`resultType`.
`resultType`直接对应一个单一的Java类.
`resultMap`则对应的是自定义映射规则,并且还可加入`association`,`collection`等标签完成其他操作.
**Very Complex Result Map**
```xml
<resultMap id="detailedBlogResultMap" type="Blog">
  <constructor>
    <idArg column="blog_id" javaType="int"/>
  </constructor>
  <result property="title" column="blog_title"/>
  <association property="author" javaType="Author">
    <id property="id" column="author_id"/>
    <result property="username" column="author_username"/>
    <result property="password" column="author_password"/>
    <result property="email" column="author_email"/>
    <result property="bio" column="author_bio"/>
    <result property="favouriteSection" column="author_favourite_section"/>
  </association>
  <collection property="posts" ofType="Post">
    <id property="id" column="post_id"/>
    <result property="subject" column="post_subject"/>
    <association property="author" javaType="Author"/>
    <collection property="comments" ofType="Comment">
      <id property="id" column="comment_id"/>
    </collection>
    <collection property="tags" ofType="Tag" >
      <id property="id" column="tag_id"/>
    </collection>
    <discriminator javaType="int" column="draft">
      <case value="1" resultType="DraftPost"/>
    </discriminator>
  </collection>
</resultMap>
```

### ResultMap所对应的数据结构
在`org.apache.ibatis.mapping`包下有`ResultMap`和`ResultMapping`类,按照Mybatis默认的命名规则`ResultMap`则是一个xml钟ResultMap的数据结构,而其中的每一个映射配置则是`ResultMapping`,如下图.具体的属性也就是xml中所能使用的元素.
![](http://res.mrdear.cn/1516117084.png?imageMogr2/thumbnail/!100p)


### 结果映射是如何构造的
Mybatis属于交互式框架,也就是说他会在使用前把绝大多数所需要的环境准备好,使用时直接取出来对应的东西.
Mybatis中每一个sql方法最终都会对应一个`MappedStatement`对象,该对象的属性就是执行该sql所需要的交互环境.该对象中有`private List<ResultMap> resultMaps;``储存需要的结果映射信息.

#### 使用resultType配置结果映射
在`org.apache.ibatis.builder.MapperBuilderAssistant#getStatementResultMaps`方法中有对resultType的处理.其构造完成后则形成如下图所示的ResultMap对象.
```java
ResultMap inlineResultMap = new ResultMap.Builder(
          configuration,
          statementId + "-Inline",
          resultType,
          new ArrayList<ResultMapping>(),
          null).build();
      resultMaps.add(inlineResultMap);
```
![](http://res.mrdear.cn/1516116391.png?imageMogr2/thumbnail/!70p)

#### 使用resultMap配置结果映射
首先resultMap中大概会有如下的元素
```xml
constructor - 类在实例化时,用来注入结果到构造方法中
idArg - ID 参数;标记结果作为 ID 可以帮助提高整体效能
arg - 注入到构造方法的一个普通结果
id – 一个 ID 结果;标记结果作为 ID 可以帮助提高整体效能
result – 注入到字段或 JavaBean 属性的普通结果
association – 一个复杂的类型关联;许多结果将包成这种类型
嵌入结果映射 – 结果映射自身的关联,或者参考一个
collection – 复杂类型的集
嵌入结果映射 – 结果映射自身的集,或者参考一个
discriminator – 使用结果值来决定使用哪个结果映射
case – 基于某些值的结果映射
嵌入结果映射 – 这种情形结果也映射它本身,因此可以包含很多相 同的元素,或者它可以参照一个外部的结果映射。
```
同样在`org.apache.ibatis.builder.MapperBuilderAssistant#getStatementResultMaps`方法中,有如下这样的逻辑,该操作是去`configuration`中获取已经生成好的resultMap,然后直接保存到`MappedStatement`对象中.取出来的命名则为statmentId+点+resultMapId
```java
if (resultMap != null) {
      String[] resultMapNames = resultMap.split(",");
      for (String resultMapName : resultMapNames) {
        try {
          resultMaps.add(configuration.getResultMap(resultMapName.trim()));
        } catch (IllegalArgumentException e) {
          throw new IncompleteElementException("Could not find result map " + resultMapName, e);
        }
      }
    }
```
那么`configuration`对象中的resultMap只能是解析的时候配置进来的.
在`org.apache.ibatis.builder.xml.XMLMapperBuilder#resultMapElement(org.apache.ibatis.parsing.XNode, java.util.List<org.apache.ibatis.mapping.ResultMapping>)`方法中有着解析的逻辑.
代码太长就不贴了,可以自己去看源码.
每一个子节点都是一个`ResultMapping`,那么在构造`ResultMap`之前,这里会先构造`ResultMapping`. 这里的逻辑对`constructor`,`discriminator`,`id`三个字段做了特殊处理.对于其他字段一视同仁.

下面代码根据ResultMap中的节点构造`ResultMapping`,那么一视同仁的行为自然在`buildResultMappingFromContext()`方法中.
```java
for (XNode resultChild : resultChildren) {
      if ("constructor".equals(resultChild.getName())) {
        processConstructorElement(resultChild, typeClass, resultMappings);
      } else if ("discriminator".equals(resultChild.getName())) {
        discriminator = processDiscriminatorElement(resultChild, typeClass, resultMappings);
      } else {
        List<ResultFlag> flags = new ArrayList<ResultFlag>();
        if ("id".equals(resultChild.getName())) {
          flags.add(ResultFlag.ID);
        }
        resultMappings.add(buildResultMappingFromContext(resultChild, typeClass, flags));
      }
    }
```
这里如果想验证你的想法,那么可以注释掉Mybatis对于xml校验的逻辑`org.apache.ibatis.parsing.XPathParser#createDocument`中`factory.setValidating(validation)`这一行语句,然后你会发现`result`,`association`,`collection`等字段其实都是等价的.互相换也不会影响到结果.具体过程感兴趣可以仔细看代码.
`ResultMapping`准备完后接下来就是构造`ResultMap`,具体逻辑在`org.apache.ibatis.builder.ResultMapResolver#resolve`方法中.由于上下文环境已构建好,这里的逻辑只是把一堆`ResultMapping`整理,放到对应的属性中.那么`ResultMap`构造完毕.

### ResultMap在Executor执行后是怎么对结果处理的?
前面的流程把上下文也就是`MappedStatement`对象构造好,查询完后由`DefaultResultSetHandler`进行取出转换.
在`org.apache.ibatis.executor.resultset.DefaultResultSetHandler#handleResultSets`方法中有着转换的逻辑.

其中转换主要是三件事
第一找出正确的ResultMap.(`org.apache.ibatis.executor.resultset.DefaultResultSetHandler#resolveDiscriminatedResultMap`)
第二对于每一行都使用该ResultMap处理(`org.apache.ibatis.executor.resultset.DefaultResultSetHandler#getRowValue`)
第三对于每一列使用ResultMapping处理.(`org.apache.ibatis.executor.resultset.DefaultResultSetHandler#applyPropertyMappings`)
最终形成结果.

### 插入写回主键是如何实现的?支持批量吗?
写回主键主要是在插入时执行`KeyGenerator`的`processAfter()`方法,从`Statement`中拿回主键.
拿回主键写入到输入参数中,那么这里自然也需要拿到输入参数
**Mybatis写回主键拿到输入参数**
从代码中可以看出Mybatis支持Object,collection,list,array形式的输入参数,另外就是要求构建参数的Map中存在对应的key`collection,list,array`,关于这一点可以看我之前关于构建输入参数的文章分析.
也就是Mybatis支持**批量插入返回主键**.
```java
  private Collection<Object> getParameters(Object parameter) {
    Collection<Object> parameters = null;
    if (parameter instanceof Collection) {
      parameters = (Collection) parameter;
    } else if (parameter instanceof Map) {
      Map parameterMap = (Map) parameter;
      if (parameterMap.containsKey("collection")) {
        parameters = (Collection) parameterMap.get("collection");
      } else if (parameterMap.containsKey("list")) {
        parameters = (List) parameterMap.get("list");
      } else if (parameterMap.containsKey("array")) {
        parameters = Arrays.asList((Object[]) parameterMap.get("array"));
      }
    }
    if (parameters == null) {
      parameters = new ArrayList<Object>();
      parameters.add(parameter);
    }
    return parameters;
  }
```
另外一点这里是依赖JDBC驱动的,使用前要先确定你的数据库是否支持写回多个主键.
```java
for (Object parameter : parameters) {
          // there should be one row for each statement (also one for each parameter)
          //这里依赖你的数据库,当jdbc驱动能返回多个主键时才可处理,否则仍然是不支持多个主键写回.
          if (!rs.next()) {
            break;
          }
          final MetaObject metaParam = configuration.newMetaObject(parameter);
          if (typeHandlers == null) {
            typeHandlers = getTypeHandlers(typeHandlerRegistry, metaParam, keyProperties, rsmd);
          }
          populateKeys(rs, metaParam, keyProperties, typeHandlers);
        }
```

### 总结
有点记流水账的感觉,源码分析文章只能起到指引到作用,具体还是自己查看源代码写Test Case,然后一路Debug才能理解深刻.
最后分享下个人的Mybatis阅读仓库项目,使用的是Mybatis的3.4.6-SNAPSHOT版本,数据库则是H2,使用者直接在`mybatis-demo`中写测试用例即可.
github: [https://github.com/mrdear/Study-Mybatis](https://github.com/mrdear/Study-Mybatis)