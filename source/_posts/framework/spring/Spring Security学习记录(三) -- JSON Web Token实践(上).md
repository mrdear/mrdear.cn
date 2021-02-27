---
title: Spring Security学习记录(三) -- JSON Web Token实践(上)
subtitle: Spring Security学习记录(三) -- JSON Web Token实践(上)
cover: http://imgblog.mrdear.cn/springsecurity.png
author: 
  nick: 屈定
tags:
  -  Spring
categories: Spring系列专题
urlname: framework-spring-security3
date: 2017-06-26 16:36:33
updated: 2017-06-26 16:36:33
---
JWT实际上与Spring Security没多大关系,本文打算使用Spring Security配合JWT这种方式完成用户的认证和授权.
- - - - -
JSON Web Token(JWT),是一个开放安全的行业标准,用于多个系统之间传递安全可靠的信息.关于其解释可以参考博文:
[JSON Web Token - 在Web应用间安全地传递信息](http://blog.leapoahead.com/2015/09/06/understanding-jwt/)
因为原作者写的很详细,这里就只说下个人认为比较重要的问题.

### JWT是什么样子的结构?
JSON Web Token说到底也是一串token,其形式分三段,看下图,**红色**的为Header,指定token类型与签名类型,**紫色**的为请求体,存储用户id等关键信息,最后**蓝色**的为签名,保证整个信息的完整性,可靠性.
![](http://imgblog.mrdear.cn/1498469217.png?imageMogr2/thumbnail/!70p)
其中playload中可以
- iss: 该JWT的签发者
- sub: 该JWT所面向的用户
- aud: 接收该JWT的一方
- exp(expires): 什么时候过期，这里是一个Unix时间戳
- iat(issued at): 在什么时候签发的
- nbf: 定义在什么时间之前，该jwt都是不可用的.
- jti: jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击。

### JWT是一个怎样的流程?
1. 客户端使用账户密码请求登录接口
2. 登录成功后返回JWT
3. 客户端再次请求其他接口时带上JWT
4. 服务端接收到JWT后验证签名的有效性.

### JWT解决了什么问题?
**token被劫持**
一开始理解很容易陷入一个误区,比如有人会问对于JWT来说,jwt被劫持了的话,那么对方就可以伪造请求,这东西怎么能保证安全呢?
这里问题是没理解好JWT,JWT解决的是认证与授权的问题,上述劫持或者类似的中间人攻击是JWT不可避免的,也是其他认证与授权方式不可避免的,想避免可以使用HTTPS,或者签发jwt的时候记录下Client的ip地址,这些就和JWT没关系了.

**与Session的区别**
session实际上是基于cookie来传输的,最重要的session信息是存储在服务器的,所以服务器每次可以通过cookie中的sessionId获取到当前会话的用户,对于单台服务器这样做没问题,但是对于多台就涉及到共享session的问题了,而且认证用户的增多,session会占用大量的服务器内存.
那么jwt是存储在客户端的,服务器不需要存储jwt,jwt里面有用户id,服务器拿到jwt验证后可以获得用户信息.也就实现了session的功能,但是相比session,jwt是无状态的,其不与任何机器绑定,只要签名秘钥足够的安全就能保证jwt的可靠性.

### JWT下服务端认为什么样子的请求是可信的?
对于服务端来说,无法确定下一个请求是哪一个用户,哪一个终端发出,所以其需要一些信息定位到该用户或者该机器,对于JWT来说其Playload里面存储着UserId,那么服务端接收到Token后对其进行签名验证,验证成功,则认为其是**可信的**,然后通过UserId从DB或者Cache中查询出来用户信息.

### 为什么JWT能保证信息传输的安全可靠?
比如现在有token
```text
eyJhbGciOiJIUzI1NiJ9.
eyJleHAiOjE0OTg0ODIxNTQsInN1YiI6InF1ZGluZyIsInVzZXJJZCI6IjEwMzc5NDAxIiwicm9sZSI6ImFkbWluIn0.
-YFTYJ6FLlIQqD4G3hYcWvYlYE8H9eAA2369WEcJFVY

```
```json
Header
{
  "alg": "HS256"
}
Playload
{
  "exp": 1498482154,
  "sub": "quding",
  "userId": "10379401",
  "role": "admin"
}
Sign
YFTYJ6FLlIQqD4G3hYcWvYlYE8H9eAA2369WEcJFVY
```
假设我的playload被其他人劫持了,其他人把userId修改为他自己的,比如123456,但是其没有签名的秘钥,所以他就没法生成签名.
服务端收到该Token后,会用先Base64解码出来相应的信息,然后重新生成sign,使用该sign与客户端传来的Sign进行对比,一样则证明没被修改,也就是可信的请求,否则拒绝该请求.

下一篇开始实战.

> github地址:  [https://github.com/nl101531/JavaWEB](https://github.com/nl101531/JavaWEB)

