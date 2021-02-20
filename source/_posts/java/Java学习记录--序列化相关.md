---
title: Java--序列化知识点
subtitle: Java中序列化相关知识
cover: http://imgblog.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java      
categories: 夯实Java基础
urlname: java_serializable
date: 2017-05-02 16:00:00
updated: 2017-05-02 16:00:00
---

今天线上遇到了DTO类实现了`Serializable`接口,但是其并没有显示声明`serialVersionUID`,这样的话每次打包有改动JDK就会为其重新生成`serialVersionUID`.这就带来了不同版本之间的实体类可能反序列化不成功,线上RPC调用出现了问题.那么就深入探讨一下原因.

### Serializable的作用
看该类的JDK注释可以发现`The serialization interface has no methods or fields and serves only to identify the semantics of being serializable.`也就是说Serializable是一个标识接口,和`Cloneable`接口等一样的效果.
如下面的User类,实现了序列化接口,并使用`serialVersionUID`标识其序列化对应的ID序号.
```java
  static class User implements Serializable {
    private static final long serialVersionUID = 5768430629641297769L;
    private String nickname;
    private String passwd;
    //省略get和set
```

### 如何序列化
`java.io.ObjectOutputStream`代表对象输出流,其使用writeObject()方法把对象实例转换为字节流然后写入到文件,或者用于网络传输.
```java
  @Test
  public void testWriteObj() throws IOException {
    User userDO = new User();
    userDO.setNickname("屈定");
    userDO.setPasswd("123456");
    File file = new File("user.out");
    ObjectOutputStream outputStream = new ObjectOutputStream(new FileOutputStream(file));
    outputStream.writeObject(userDO);//序列化写入到文件中.
    outputStream.close();
  }
```

### 如何反序列化
`java.io.ObjectInputStream`代表对象输入流,其使用readObject()方法读取序列化的字节,然后再转换为对象.
```java 
  @Test
  public void testReadObj() throws IOException, ClassNotFoundException {
    File file = new File(base+File.separator+"user.out");
    ObjectInputStream inputStream = new ObjectInputStream(new FileInputStream(file));
    User user = (User) inputStream.readObject();
    Assert.assertTrue(StringUtils.equals(user.getNickname(),"屈定"));
    Assert.assertTrue(StringUtils.equals(user.getPasswd(),"123456"));
  }
```
### serialVersionUID的作用
按照上面代码,序列化和反序列化都是成功的,如果在已经序列化后,对User要作修改,增加一个email字段,再试试反序列化.
```java
  static class User implements Serializable {
    private static final long serialVersionUID = 5768430629641297769L;
    private String nickname;
    private String passwd;
    private String email;
}
```
程序会正常运行,而且这个email会被很智能的初始化为null.
修改`serialVersionUID`为1L再试试.
```java
java.io.InvalidClassException: cn.edu.aust.test.ObjectTest$User; local class incompatible: stream classdesc serialVersionUID = 5768430629641297769, local class serialVersionUID = 1
```
报错很明显,两边类的`serialVersionUID`不一样,也就是说对于编译好的class,其`serialVersionUID`是其序列化的唯一标识,如果未显示声明JDK则会自动为其加上,换句话说`serialVersionUID`保证了对象的向上兼容,可以使用命令`seriserialver`可以查看一个class文件的`serialVersionUID`,当线上版本忘记加该字段的时候该命令还是很有用处的.
```sh
seriserialver cn.edu.aust.test.ObjectTest\$User 
cn.edu.aust.test.ObjectTest$User:    private static final long serialVersionUID = 1L;
```
另外需要注意反序列化因为是直接从字节流里面构造出对象,因此并不会去执行构造函数.如果你的类有在构造函数中初始值的行为,那么这里就可能得到异常.

### transient的作用
transient翻译为瞬时,也就是被其修饰的变量序列化时会忽略该字段.什么时候需要用到这个字段呢?
在Java中对象之间的关系会组成一个对象图,序列化的过程是对该对象图的遍历,那么反序列化也仍然是对该对象图的遍历.对于对象里面的对象就是递归过程,对于链表之类的数据结构递归的话很容易引起栈溢出,那么就可以使用`transient`忽略该字段.

### 使用自己定制的序列化规则那么需要声明serialVersionUID吗?
最好声明下,因为你不能保证你用的第三方库使用的不是jdk序列化方式. 比如Spring data redis使用的默认序列化规则就是jdk默认序列化.




