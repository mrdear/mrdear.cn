---
title: Maven子模块打包后拷贝目标文件到父模块
subtitle: Maven子模块打包后拷贝目标文件到父模块
cover: http://imgblog.mrdear.cn/maven.png
author: 
  nick: 屈定
tags:
  - Maven    
categories: 实战总结
urlname: mvn_submodule_copy
date: 2017-07-29 15:15:56
updated: 2017-07-29 15:15:56
---
看着这个标题一定想怎么会有这么奇怪的需求....
嗯,我也认为这个是很奇怪的需求,但实际上确实存在.
- - - - -

### 问题
最近对公司一个大项目进行整改,该项目是写在一个模块下,也就是一个Maven项目,因此打算把其更改为Maven多模块项目.目录结构的变化如下:
原目录结构
```java
buy
   ---src
       ---main
       ---test
   ---conf
```
更改后的为,也就是按照业务分为三个部分,其中gateway是打包的入口,不含有业务逻辑,其引用其他两个模块.
```java
buy
   ---buy-shop
        ---src
        ---main
        ---test
   ---buy-course
        ---src
        ---main
        ---test
   ---buy-gateway
        ---src
        ---main
        ---test
   ---conf
```
那么自然而然打包后生成的buy.war就到了`buy-gateway/target`这个目录下,对于`master`分支的代码是生成在`buy/target`目录下,这样就倒是线上的自动化打包失效,首先保证master能打包成功就不能更改线上的配置,因此需要把`buy-gateway/target/buy.war`打包成功后拷贝到`buy/target/buy.war`,保证线上打包脚本的运行.
- - - - -
### 解决方案
解决方案是`maven-dependency-plugin`这款插件,该插件有copy功能,可以自由选择target目录下的任意文件拷贝(要注意该插件不同版本配置是有差异的,如果一直不成功就要检查下配置)
```xml
<plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <version>3.0.1</version>
                <executions>
                    <execution>
                        <id>copy</id>
                        <phase>package</phase>
                        <goals>
                            <goal>copy</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <artifactItems>
                        <!--把target目录下的war拷贝到buy/target下-->
                        <artifactItem>
                            <groupId>${project.groupId}</groupId>
                            <artifactId>${project.artifactId}</artifactId>
                            <version>${project.version}</version>
                            <type>${project.packaging}</type>
                            <overWrite>true</overWrite>
                            <outputDirectory>${project.parent.build.directory}</outputDirectory>
                            <destFileName>buy.war</destFileName>
                        </artifactItem>
                    </artifactItems>
                </configuration>
            </plugin>
```

该模块可以用于各种资源的拷贝,因此不要局限于war包

**备注**:
maven中常见的变量 [maven常用配置的变量](http://qiaolevip.iteye.com/blog/1816652)