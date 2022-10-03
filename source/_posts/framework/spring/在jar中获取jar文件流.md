---
title: Spring Boot -- 如何获取已加载的JAR文件流
subtitle: Spring Boot获取Fat Jar内部的依赖包
cover: http://res.mrdear.cn/mrdearblog-springboot.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-jar-in-jar
date: 2019-03-19 08:59:25
updated: 2019-03-19 08:59:28
---

最近遇到一个需求，在程序运行期间，拿到已加载类对应的jar包，然后上传到另一个地方，本以为利用ClassLoader直接定位到jar的`InputStream`流直接读取就ok，事实却没有这么简单，我把问题总结为以下几个小点，逐一解决。

## 如何根据已加载的类定位到jar？
对于已加载的类，可以通过其对应的Class类的`getProtectionDomain()`方法获取到对应的文件信息，以获取`commons-lang3`jar包为例，如清单1所示。
**清单1: 根据加载类定位到文件**
```java
        Class<StringUtils> clazz = StringUtils.class;
        ProtectionDomain domain = clazz.getProtectionDomain();
        // 获取到对应的jar文件
        URL jarFile = domain.getCodeSource().getLocation();
        // 获取到对应的类加载器
        ClassLoader classLoader = domain.getClassLoader();
```
该代码在不同环境下运行返回又是什么情况呢？
### 本地IDE运行
在IDEA中直接运行返回如下所示，很明显IDEA在运行时会把maven仓库中对应的jar路径放入classpath下，运行起来后类加载器自动寻找对应的jar，所以定位到了具体的maven目录。
**清单2: IDE直接运行输出**
```txt
file:/Users/quding/.m2/repository/org/apache/commons/commons-lang3/3.7/commons-lang3-3.7.jar
```

### 打包成jar运行
单纯的打包为一个jar，Java会把其中的依赖第三方jar解压后一起放入到jar中，如下图所示，因此定位到的是我最终打包为的jar文件，而并非第三方jar文件。因此如果是在这种环境下推荐使用指定classpath形式。
**清单3: 打包成jar输出**
```txt
file:/Users/quding/workspace/git/jar-mvn1/target/jar-mvn1-1.0-SNAPSHOT.jar
```
![](http://res.mrdear.cn/1552829550.png)

### 打包成war运行
写了个接口，返回值是一个具体的文件路径，原因也很简单，因为Tomcat在启动一个webapp时会将对应的war解压，然后针对解压后的路径使用一个单独的类加载器进行加载。
**清单4: 打包成war包输出**
```json
{
"jarFile": "file:/Users/quding/develop/apache-tomcat-8.5.38/webapps/ROOT/WEB-INF/lib/commons-lang3-3.7.jar"
}
```
### 打包成fat jar
fat jar是Spring Boot引入的一种新格式，其打包后的结构与war包比较类似，但是可以直接执行并不需要先解压再加载，打包后类似目录如下：
![](http://res.mrdear.cn/1552834775.png)
1. BOOT-INF/classes  -- 用户代码
2. BOOT-INF/lib  --依赖第三方架包
3. org/springframewora/boot/loader   -- Fat jar启动核心，后续会分析。

此时获取对应的jar，输出如清单5所示，可以看到与前面几种不同，此时路径为jar嵌套形式，暂且定义为`jar in jar`。
**清单5: 打包成Fat jar输出**
```json
{
"jarFile": "jar:file:/Users/quding/workspace/git/read-jar-demo/target/read-jar-demo-0.0.1-SNAPSHOT.jar!/BOOT-INF/lib/commons-lang3-3.7.jar!/"
}
```
其路径可以分为两个部分看，第一部分`jar:file:/Users/quding/workspace/git/read-jar-demo/target/read-jar-demo-0.0.1-SNAPSHOT.jar!`，表示当前根架包位置，第二部分`/BOOT-INF/lib/commons-lang3-3.7.jar!/`所需要的jar在根架包中的位置路径。

## 如何读取jar？
对于非`jar in jar`形式，其获取到的目录是一个真是的物理文件路径，因此可以直接使用`File`读取，从而拿到文件流，这里不重点关注。对于`jar in jar`因为并不是规范的文件路径，因此无法使用`File`直接读取，那么该怎么读呢？要解决这个问题需要先了解Spring Boot是怎么做的.

### Spring Boot启动原理
打开Spring Boot最终产出的jar包，其`MANIFEST.MF`文件表明项目的启动入口为`org.springframework.boot.loader.JarLauncher`，该类在`spring-boot-loader`模块下，运行时由Spring Boot所提供，因此可以通过maven引入provided类型的依赖从而查看到源码。
**清单6: Spirng Boot启动模块**
```xml
  <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-loader</artifactId>
            <version>2.1.3.RELEASE</version>
            <scope>provided</scope>
        </dependency>
```
`org.springframework.boot.loader.JarLauncher`做的第一步是找到自己所在jar的位置，使用方法与上文介绍的一致。
**清单7: Spring Boot定位启动jar包**
```java
protected final Archive createArchive() throws Exception {
		ProtectionDomain protectionDomain = getClass().getProtectionDomain();
		CodeSource codeSource = protectionDomain.getCodeSource();
    // 获取jar位置,对于本案例返回为 jar:file:/Users/quding/workspace/git/read-jar-demo/target/read-jar-demo-0.0.1-SNAPSHOT.jar!/
		URI location = (codeSource != null) ? codeSource.getLocation().toURI() : null;
		String path = (location != null) ? location.getSchemeSpecificPart() : null;
		if (path == null) {
			throw new IllegalStateException("Unable to determine code source archive");
		}
		File root = new File(path);
		if (!root.exists()) {
			throw new IllegalStateException(
					"Unable to determine code source archive from " + root);
		}
		return (root.isDirectory() ? new ExplodedArchive(root)
				: new JarFileArchive(root));
	}
```
之后通过`java.protocol.handler.pkgs`参数注册对应的URL协议扩展，该参数格式为`[package_path].[protocol].Handler`，因此Spring Boot注册的为`org.springframework.boot.loader.jar.Handler`这个jar协议扩展处理器，其在读取资源时会调用`openConnection`方法，如清单8所示：
**清单8: Spring Boot URL处理器**
```java
protected URLConnection openConnection(URL url) throws IOException {
    // 判断资源是否在该jar中,如果在则去jar中获取
		if (this.jarFile != null && isUrlInJarFile(url, this.jarFile)) {
			return JarURLConnection.get(url, this.jarFile);
		}
		try {
      // 如果不在则去对应的根路径jar获取
			return JarURLConnection.get(url, getRootJarFileFromUrl(url));
		}
		catch (Exception ex) {
      // 获取失败使用JDK自带的方式获取,作为备份方案
			return openFallbackConnection(url, ex);
		}
	}
```
由上述逻辑可以发现，当URL为`jar:file:/Users/quding/workspace/git/read-jar-demo/target/read-jar-demo-0.0.1-SNAPSHOT.jar!/BOOT-INF/lib/commons-lang3-3.7.jar!/`形式，最终会调用`JarURLConnection.get(url, this.jarFile)`方法来获取真正的jar文件，该`JarURLConnection`并非JDK自带的类，其为`class JarURLConnection extends java.net.JarURLConnection`，因此在运行时可以安全的向上转型为`java.net.JarURLConnection`，在其get方法中会对URL进行循环处理，对结果进行嵌套包装，近而解决jar in jar类型的读取问题。
**清单9: jar in jar循环读取**
```java
while ((separator = spec.indexOf(SEPARATOR, index)) > 0) {
    // 读取对应的资源
			JarEntryName entryName = JarEntryName.get(spec.subSequence(index, separator));
			JarEntry jarEntry = jarFile.getJarEntry(entryName.toCharSequence());
			if (jarEntry == null) {
				return JarURLConnection.notFound(jarFile, entryName);
			}
      // 结果嵌套包装
			jarFile = jarFile.getNestedJarFile(jarEntry);
			index = separator + SEPARATOR.length();
		}
```
最后会根据得到的URL路径创建对应的类加载器`org.springframework.boot.loader.LaunchedURLClassLoader`，使用该类加载器进行加载。

### 利用Handler读取jar
Spring Boot启动原理的关键点是实现了`jar in jar`协议的处理器`org.springframework.boot.loader.jar.Handler`，读取的主要功能为Handler中实现的`openConnection`方法，因此当在项目代码中想要读取jar in jar格式的架包，则可以用该Handler进行资源读取。
```java
URL url = new URL(jarFile, "", new org.springframework.boot.loader.jar.Handler());
```

## 参考
[spring boot应用启动原理分析](http://hengyunabc.github.io/spring-boot-application-start-analysis/)
