---
title: 实践--用户登录注册相关设计
subtitle: 最近一个小项目中关于用户表以及密码安全等相关设计经验
cover: http://res.mrdear.cn/blog_mrdear_work.png
author: 
  nick: 屈定
tags:
  - 实战
categories: 实战总结
urlname: work_how_design_user_login
date: 2018-08-18 03:08:51
updated: 2018-08-18 03:08:53
---
最近做一个网站，网站需要用户登录注册，自然也就需要一套高扩展性的用户模块设计，该篇文章记录笔者遇到问题的解决方案，希望对你有帮助。

- - - - - 

## 用户表设计
登录包含邮箱密码登录以及第三方登录，且第三方登录存在不确定性，可能随时增加或者减少某个渠道。
因此在设计上考虑把用户基本信息与登录信息分开，如下所示

**清单1：用户表结构**
```sql
`user` (
  `id`
  `username` 
  `email` 
  `avatar` 
  `status` 
```
用户表保存了用户的基本信息，供站内的一些其他服务查询使用。

**清单2：用户登录表**
```sql
`user_auth` (
  `id` 
  `uid`  '用户id',
  `identity_type` '授权类型',
  `identifier`  '授权标识id',
  `credential`  '授权秘钥或token',
  `credential_expire` 
  `status` 
```
用户登录表主要保存着用户的授权信息，这张表是一张基本表，在该授权处可以根据具体登录业务增加一些额外的字段来满足需求。存储时举个例子：

| id | uid | identify_type | identitfier | credential | credential_expire | status |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| 1 | 张三的id | 站内密码登录 | 张三的id | hash(张三的密码) | 密码过期时间 | 状态 |
| 2 | 张三的id | 微信登录 | 微信 openId | 微信accessToken | token过期时间 | 状态 |
| 3 | 张三的id | Github登录 | Github openId | Github accessToken | token过期时间 | 状态 |

这种设计的好处是用户登录相关的信息与用户本身的信息是分离的，可以很轻松的扩展或者关闭某一登录方式，另外由于每一种第三方登录都是一条记录，所以还可以得知用户某一渠道的最后使用登录时间，供后续分析用户行为。

### 注册流程
此时注册流程就相对简单了，注册只针对邮箱手机号等站内方式，站外第三方注册则放到登录流程里面做。那么只需要接收用户输入的信息，创建一条`user`表数据，再创建一条`user_auth`表站内密码登录的记录，这里就不多分析了。

### 登录流程
登录流程是相对比较复杂的，这里使用流程图来描述这一过程：
![](http://res.mrdear.cn/1534420580.png?imageMogr2/thumbnail/!100p)
大体流程分两种，一种是站内密码登录，这种方式比较简单，就是传统的密码判断是否正确，然后写回登录信息。另一种是第三方登录，该种登录需要考虑用户是否只是绑定第三方账号，是否已经注册等问题，为了让第三方登录与注册流畅进行，当用户未注册时还需要主动帮其注册账号，主动注册就会涉及到一些用户表中的必要信息生成，比如邮箱可以生成`xx-uid@weixin.com`等系统默认邮箱。


### 一些其他问题

**1. 站内登录有必要再细分吗？比如邮箱登录和手机号登录**
个人认为没必要细分，站内登录无论是邮箱还是手机号都是用户的基本信息，因此是可以放入到`user`表中，而`user_auth`表只保存一条对应用户密码设置的记录就好。
如果细分，则对应`user_auth`表中有邮箱登录与手机号登录两个记录，那么当修改密码时就要同时修改，无疑是增加了复杂度。

## 密码如何处理才安全？
登录中用户密码如何存储是一个大问题，密码一般不存储明文而是存储对应的hash值，hash本身是单向流程，那么破解只能暴力枚举法或者查表法（事先计算好一批hash值，然后通过数据库等搜索查找），而后端所需要做的防护是提高这两种破解方式的成本，好在业内已经有了比较靠谱的解决方案：`慢哈希 + 加盐`处理。
`慢哈希`是应对暴力枚举法的一种方式，暴力枚举法理论上来说最终一定会找到符合条件的密码，高端的硬件每秒可进行数十亿次hash计算，因此`慢哈希`的思路是使hash计算变得缓慢，一般使用多次迭代计算hash方式，那么即使使用高端硬件，破解速度也是令人无法接受。
`加盐`是应对查表法的一种思路，加盐的本质是让用户的密码更加复杂，盐本身是一个随机值，使用一定算法混淆在用户的密码中，因此即使同样的密码在加盐后也会得到不同的Hash值，那么就可以保证查表得到明文后，由于不了解加盐算法，所以也无法得到用户的实际密码。

在Java中处理形式如下（此代码参考自[加盐密码哈希：如何正确使用](http://blog.jobbole.com/61872/)）：

**清单3：Java中密码加盐处理**
```java
 public static String createHash(char[] password)
      throws NoSuchAlgorithmException, InvalidKeySpecException {
    // Generate a random salt
    SecureRandom random = new SecureRandom();
    byte[] salt = new byte[SALT_BYTE_SIZE];
    random.nextBytes(salt);

    // Hash the password
    byte[] hash = pbkdf2(password, salt, PBKDF2_ITERATIONS, HASH_BYTE_SIZE);
    // format iterations:salt:hash
    return PBKDF2_ITERATIONS + ":" + toHex(salt) + ":" +  toHex(hash);
  }
```
大概流程是使用`SecureRandom`产生伪随机数作为盐，然后使用`pbkdf2`算法迭代一定次数得到密码所对应的最终hash值，存储到数据库的时候形式为`慢哈希迭代次数：盐：密码最终hash值`。
然后验证方式如清单4所示：

**清单4：Java中密码加盐验证**
```java
  public static boolean validatePassword(char[] password, String correctHash)
      throws NoSuchAlgorithmException, InvalidKeySpecException
  {
    // Decode the hash into its parameters
    String[] params = correctHash.split(":");
    int iterations = Integer.parseInt(params[ITERATION_INDEX]);
    byte[] salt = fromHex(params[SALT_INDEX]);
    byte[] hash = fromHex(params[PBKDF2_INDEX]);
    // Compute the hash of the provided password, using the same salt,
    // iteration count, and hash length
    byte[] testHash = pbkdf2(password, salt, iterations, hash.length);
    // Compare the hashes in constant time. The password is correct if
    // both hashes match.
    return slowEquals(hash, testHash);
  }
```
其中`password`是用户输入的密码，`correctHash`是加盐处理得到的结果字符串`慢哈希迭代次数：盐：密码最终hash值`。那么必要参数都拿到了，就可以对用户输入的密码进行正向操作，然后把得到的最终hash结果与数据库中的对比，就能判断是否输入正确。

### 慢哈希性能问题
`慢哈希`虽然提高了破解成本，但同样的也带来了性能问题，服务端计算一次hash值往往需要几百毫秒，那么在大型系统上这里是很可能成为性能瓶颈。解决方案一般有两种：
1. 适当的降低慢hash迭代次数。迭代次数低了那么速度自然就快了，这个要取决于自身的业务是否对安全性有极高的敏感。
2. 两次慢hash，客户端拿到密码后，使用用户的邮箱等固定信息作为盐，进行慢哈希迭代。服务端拿到客户端迭代结果后再次生成盐进行慢哈希迭代，服务端迭代次数可以小很多。那么在不改变慢hash目的的情况下把压力分布到客户端来降低服务端开销。

### 错误信息提示
谨记一个原则：永远不要告诉用户是用户名不对还是密码不对，要统一的给出`用户名或者密码不正确`。提高暴力枚举的成本。

## 邮箱验证功能
邮箱验证功能逻辑是比较简单的，总体来说后端产生一个100%可靠的链接发到用户邮箱，用户从该链接点击后可以进行验证。那么问题就简化成如何产生一个100%可靠的链接。
这里比较通用的做法是利用token，token具有时效性，并且与用户id，所对应的业务相关联，比较常用的做法是使用JWT Token，JWT本身把时效性，用户id等都存储在Token当中，并且Token具有签名防止伪造或者篡改，关于JWT的更多详情可以参考我之前写的[相关文章](https://mrdear.cn/search/?search=JWT)。

有了Token之后，当用户点击链接，请求到后端，后端再根据Token中的信息进行下一步的判断。

## 总结
用户模块是网站的基础，与业务的关系同样也非常耦合，因此别人的方案大多数只是用来参考，了解一些关键点的处理做法，比如密码加盐，邮箱验证，具体的设计还需要结合自身业务，切记生搬硬套。
以上大概是我这次做的一个站点中所注意到的事情，希望对你有帮助。

## 参考
[加盐密码哈希：如何正确使用](http://blog.jobbole.com/61872/)