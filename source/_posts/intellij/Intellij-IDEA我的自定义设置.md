---
title: OSX初始化指南
subtitle: 无论是笔记本还是黑苹果都折腾了许多台了,文章记录如何搭建自己的开发环境
cover: http://imgblog.mrdear.cn/mrdearblog-osx.png
author: 
  nick: 屈定
tags:
  - IntelliJ
categories: 工具
urlname: idea-setting-memo
date: 2020-02-16 22:52:46
updated: 2021-07-19 21:32:45
---

无论是笔记本还是黑苹果都折腾了许多台了，每次拿到新电脑，对于装机总是要折腾许久。理想情况下一键初始化脚本通通搞定，现实情况下五花八门的软件，不靠谱的官方同步，等等问题总是带来很多麻烦，所以还是自己一步一步来最可靠。本文记录在初始化过程中的一些配置，一方面是备份，一方面是给其他人一些使用参考，本文会根据使用情况不断更新。

## OSX

- 升级系统到最新，登录icloud
- 安装xcode开发环境

```bash
xcode-select --install
```

- 初始化GIT

```bash
 git config --global user.name "屈定"
 git config --global user.name "niudear@foxmail.com"
 git config --global alias.ci commit
 git config --global alias.br branch
 git config --global alias.co checkout
 git config --global alias.st status
```

- 初始化SSH配置，该步骤主要是将对应的公钥以及私钥复制到指定目录下
- 提前创建一些必要的文件夹

```bash
mkdir -p ~/.nvm
mkdir -p ~/.zsh_history
```

- 安装zsh，并且将配置转移

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

- 安装应用软件

```bash
Microsoft Edge 
IntelliJ IDEA
rime/squirrel   # 需要copy词库
坚果云
sketch
Notion
uPic
v2rayu
```

- 安装brew，以及常用软件

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# 命令行软件
brew install hudochenkov/sshpass/sshpass  # 命令行密码
brew install telnet 
brew install wget
brew install zsh-syntax-highlighting  # zsh插件
brew install zsh-autosuggestions # zsh插件
brew install golang
brew install nvm
brew install gradle
brew install graphviz
brew install lua
brew install gpg
brew install groovy
brew install cheat

# 安装包软件
brew install --cask iina
brew install --cask appcleaner
brew install --cask iterm2 # 需要转移配置
brew install --cask flux
brew install --cask maczip
brew install --cask hammerspoon  # 需要转移配置
brew install --cask typora 
brew install --cask licecap
brew install --cask openemu
brew install --cask pixel-picker # 屏幕取色
brew install --cask bob # 划词翻译,配合密码本使用
```



## IDEA

- 仓库配置`git@github.com:mrdear/IDEA-SETTING.git`，覆盖当前配置

### Keymap

- Add Selection for Next Occurrence  -> Ctrl + G 从光标处往下选择相同的字符

### Editor -> General -> Auto import

- General -> Auto import
  - insert imports on the paste: **ALL**
  - show inports popup for:  **classes**  **static method and field** 全部选上
  - add unambiguous imports on the fly: **开启** ，当前环境中假设一个类只有一个，那么就自动导入这个，虽然有时候会导入错误，但是往往都是正确。
  - optimize imports on the fly: **开启** ，优化导包功能，会删除无用的导入指令
  - Exclude from import and completion: 排除一些包，比如sun开头的以及其他不常用的包

```bash
com.sun
sun
com.alibaba.fastjsonfordrm
javax.xml
javax.print
```

- File and Code Template
  - File header

```java
/**
 * 
 * @author ${USER}
 * @since ${DATE}
 */
```

- Reader Mode
  - Render Doc comment：关闭，选然后注释很小，看着不方便
- Inspections
  - Serializable class without "SerializableUID" : 设置error告警

### Build

- Build tools

  - Maven：拉取代码报地址连接失败时，需要配置以下参数

  ```
  Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true -Djava.net.preferIPv4Stack=true
  ```

  

### Plugin

- INSTALL
  - .ignore
  - Atom Material Icons：可以让IDEA流畅很多，原理未知
  - ~~AceJump~~
  - CameCase
  - Class Decompile
  - Deno
  - ~~Emmylua~~
  - GenerateAllSetter
  - Go
  - Go Template
  - ~~Key Promoter X~~
  - Maven Helper
  - MyBatisX
  - PlantUML
  - Toml
- IGNORE
  - Android
  - Smail Support
  - GlassFish
  - WebLogic
  - WebSphere
  - WildFly
  - IDE Settings Sync
  - IDE Features Trainer



