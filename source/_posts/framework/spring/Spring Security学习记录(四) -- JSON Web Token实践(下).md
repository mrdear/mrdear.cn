---
title: Spring Security学习记录(四) -- JSON Web Token实践(下)
subtitle: Spring Security学习记录(四) -- JSON Web Token实践(下)
cover: http://imgblog.mrdear.cn/springsecurity.png
author: 
  nick: 屈定
tags:
  -  Spring Security    
  - jwt
categories: Spring系列专题
urlname: framework-spring-security4
date: 2017-06-30 18:19:22
updated: 2017-06-30 18:19:22
---
### 前提
接着上篇的内容,了解了JWT Token后,发现这东西就是一个可信的用户信息存储方式,那么可信的话就可以省去验证这个步骤,只有当需要用户的详细信息时候才会去DB中查询用户的详细信息.那么现在的流程就是
`用户请求 -> Spring Security通过token把tokenUser设置到上下文中 -> Spring Security Token以及权限验证 -> 具体的业务接口 -> 需要详细信息则根据用户id去DB中获取`
那么就会有以下几个问题.
#### token在什么时候生成?
这个在登录接口中生成,登录后token放入用户id,用户权限等基础信息,以供验证使用.
#### token签名的密钥该使用什么?
这个我也不太清楚,写死一个密钥感觉很不安全,我的想法是使用用户的密码的密文作为签名密钥,这样当用户更改密码的时候原token都是失效.
这样做有个缺点,用户密码的密文每次获取需要查询DB,势必会造成DB的压力,可以考虑加缓存,但要考虑缓存挂掉的情况下对DB的压力.
#### token该怎么较少被盗后的损失?
token既然被系统认为是可信的信息集合,那么就需要有相应的超时机制,超时机制是为了防止token被盗用后的损失也只能在一段时间内,就和session超时机制是一样的用处.
#### 如何解决SSO?
SSO需要借助cookie或者localStorge,把token放在顶级域名中,这样的话子系统都能使用到,也就完成的SSO机制.
对于多域名,那要解决的问题就是如何跨域设置cookie了
#### 如何解决CSRF?
CSRF产生的原因是对方使用了你的Cookie也就是使用了你的认证信息,那么的话获取token这一步就不能依赖token,所以把cookie存在cookie中,然后请求时放入header中,解析时从header中获取token信息.
- - - - -

### 实践

#### JWT签名与验签
首先POM引入依赖包
```xml
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.7.0</version>
        </dependency>
```
接着定义一个简单的用户,用作存储在上下文中
```java
public class TokenUserDTO {
  private Long id;
  private String username;
  private String email;
  private String avatar;
  private List<String> roles;
  //省略get set
}
```
接着实现jwt
```java
/**
   * 从用户中创建一个jwt Token
   * @param userDTO 用户
   * @return token
   */
  public String create(TokenUserDTO userDTO) {
    return Jwts.builder()
        .setExpiration(new Date(System.currentTimeMillis() + VALIDITY_TIME_MS))
        .setSubject(userDTO.getUsername())
        .claim("id", userDTO.getId())
        .claim("avatar", userDTO.getAvatar())
        .claim("email", userDTO.getEmail())
        .claim("roles", userDTO.getRoles())
        .signWith(SignatureAlgorithm.HS256, secret)
        .compact();
  }

  /**
   * 从token中取出用户
   */
  public TokenUserDTO parse(String token) {
    Claims claims = Jwts.parser()
        .setSigningKey(secret)
        .parseClaimsJws(token)
        .getBody();
    TokenUserDTO userDTO = new TokenUserDTO();
    userDTO.setId(NumberUtils.toLong(claims.getId()));
    userDTO.setAvatar(claims.get("avatar",String.class));
    userDTO.setUsername(claims.get("username",String.class));
    userDTO.setEmail(claims.get("email",String.class));
    userDTO.setRoles((List<String>) claims.get("roles"));
    return userDTO;
  }
```
#### Spring Security过滤
上述流程中Spring Security所承担的角色是验证token+保存token解析出来的用户到`SecurityContextHolder`中,弄清楚角色那么实现就很简单了.看之前的过滤器链,
蓝色框内包含跨站攻击检测与用户信息获取校验,因为用的是jwt所以这些都可以省略掉,替换为解析并验证token,然后设置解析后的用户到上下文中.
![](http://imgblog.mrdear.cn/1499046528.png?imageMogr2/thumbnail/!70p)

首先`SecurityContextHolder`中存储的是`Authentication`对象,所以需要在TokenUser基础封装一层认证用户.
```java
/**
 * Spring Security中存放的认证用户
 * @author Niu Li
 * @since 2017/6/28
 */
public class TokenUserAuthentication implements Authentication {

  private static final long serialVersionUID = 3730332217518791533L;

  private TokenUserDTO userDTO;

  private Boolean authentication = false;

  public TokenUserAuthentication(TokenUserDTO userDTO, Boolean authentication) {
    this.userDTO = userDTO;
    this.authentication = authentication;
  }
    //这里的权限是FilterSecurityInterceptor做权限验证使用
  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return userDTO.getRoles().stream()
        .map(SimpleGrantedAuthority::new).collect(Collectors.toList());
  }

  @Override
  public Object getCredentials() {
    return "";
  }

  @Override
  public Object getDetails() {
    return userDTO;
  }

  @Override
  public Object getPrincipal() {
    return userDTO.getUsername();
  }

  @Override
  public boolean isAuthenticated() {
    return authentication;
  }

  @Override
  public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
    this.authentication = isAuthenticated;
  }

  @Override
  public String getName() {
    return userDTO.getUsername();
  }
}
```
然后实现验签方法,验签是从header中取出相应的token,验签成功后返回一个`Authentication`的对象.
```java
  /**
   * 验签
   */
  public Optional<Authentication> verifyToken(HttpServletRequest request) {
    final String token = request.getHeader(AUTH_HEADER_NAME);
    if (token != null && !token.isEmpty()){
      final TokenUserDTO user = parse(token.trim());
      if (user != null) {
        return Optional.of(new TokenUserAuthentication(user, true));
      }
    }
    return Optional.empty();
  }
```
最后实现验证Token的过滤器
```java
/**
 *  jwt token验证类,验证成功后设置进去SecurityContext中
 * @author Niu Li
 * @since 2017/6/28
 */
@Slf4j
public class VerifyTokenFilter extends OncePerRequestFilter {

  private JwtTokenUtil jwtTokenUtil;

  public VerifyTokenFilter(JwtTokenUtil jwtTokenUtil) {
    this.jwtTokenUtil = jwtTokenUtil;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    try {
      Optional<Authentication> authentication = jwtTokenUtil.verifyToken(request);
      log.debug("VerifyTokenFilter result: {}",authentication.orElse(null));
      SecurityContextHolder.getContext().setAuthentication(authentication.orElse(null));
      filterChain.doFilter(request,response);
    } catch (JwtException e) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      //可以在这里指定重定向还是返回错误接口示例
    }
  }
}
```
配置下Spring Security,主要就是关闭一些不用的过滤器,实现自己的验证过滤器.
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
  @Resource
  private JwtTokenUtil jwtTokenUtil;
  /**
   * 在此配置不过滤的请求
   */
  @Override
  public void configure(WebSecurity web) throws Exception {
    //每一个请求对应一个空的filter链,这里一般不要配置过多,
    // 因为查找处是一个for循环,过多就导致每个请求都需要循环一遍直到找到
    web.ignoring().antMatchers("/","/login","/favicon.ico");
  }
  /**
   * 在此配置过滤链
   */
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
        .authorizeRequests()
        //角色定义,Spring Security会在其前面自动加上ROLE_,因此存储权限的时候也要加上ROLE_ADMIN
        .antMatchers("/detail").access("hasRole('ADMIN')")
        .anyRequest().permitAll().and()
        //异常处理,可以再此使用entrypoint来定义错误输出
        .exceptionHandling().and()
        //不需要session来控制,所以这里可以去掉
        .securityContext().securityContextRepository(new NullSecurityContextRepository()).and()
        //开启匿名访问
        .anonymous().and()
        //退出登录自己来控制
        .logout().disable()
        //因为没用到cookies,所以关闭cookies
        .csrf().disable()
        //验证token
        .addFilterBefore(new VerifyTokenFilter(jwtTokenUtil),
            UsernamePasswordAuthenticationFilter.class);
  }
}
```
这样做的话,验证就需要在相应的代码中,或者对指定链接使用Spring Security的权限验证.
```java
  /**
   * 该链接尝试获取登录用户,返回该认证用户的信息,请求该链接需要在header中放入x-authorization: token
   */
  @GetMapping("/detail")
  public TokenUserDTO userDetail() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (Objects.isNull(authentication)) {
      return null;
    }
    return (TokenUserDTO) authentication.getDetails();
  }
```
或者
```java
        ...
        .antMatchers("/detail").access("hasRole('ADMIN')")
        ...
```
这样的话就实现了jwt验证,SSO问题也就是token传输的问题,使用cookie就可以了,客户端去请求时从cookie中加载token,然后放入到header中,对这里的代码没影响.

- - - - -
> github地址: [https://github.com/nl101531/JavaWEB](https://github.com/nl101531/JavaWEB)


