---
title: OSX--OSX+WIN10双系统台式机组装经验
subtitle: 黑苹果安装的一些经验
cover: http://imgblog.mrdear.cn/mrdearblog-osx.png
author: 
  nick: 屈定
tags:
  - OSX
categories: 杂七杂八
urlname: osx_install
date: 2019-02-17 18:21:45
updated: 2019-08-18 15:40:46
---

最近买了点零件组装了一台台式机，现在也装上了WIN10+OSX10.14.3体验下来还是很棒的，比我自己的MBP要流畅很多，本文分享下其中一些经验。

### 电脑配置

- **CPU**：I7 8700
- **主板**：微星B360M 迫击炮
- **显卡**：迪兰RX590 8G (在10.14系统上只有A卡才能免驱，要注意)
- **内存**：金士顿骇客神条DDR4 8G 2666 * 2
- **电源**：酷冷至尊V550 (全模组,金牌)
- **机箱**：安钛克 P8 (这个还是大,可以考虑个M ITX机箱)
- **硬盘**：英特尔760P 256G NVMe M.2(装OSX系统)，希捷酷鱼1TB(数据仓库)，三星860 EVO 250G SATA3(装WIN10，这里不能再买M2的，这个主板第二个M2接口限制很多，插上网卡后就会失效)
- **网卡**：BCM943602CS (免驱动)
- **风扇**：九州风神玄冰400焕彩版 (非常容易安装)
- **其他**：机箱风扇集线器，硅脂等也要注意哈，不然买来后发现差这些小东西才能组装很尴尬


### 安装OSX
安装前做了点功课，主要是观看B站的教学视频，这里推荐以下视频，建议1.3倍速度观看。参考视频记录下大概要做哪些事情，安装经过几个阶段，另外思考下和WIN装系统有什么区别，多思考的好处是有些情况下可以举一反三，要养成习惯。

<iframe src="//player.bilibili.com/player.html?aid=19235761&cid=31369777&page=1" height="650px"  width="100%"  scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

镜像使用：[https://blog.daliansky.net/macOS-Mojave-10.14.3-18D42-official-version-with-Clover-4859-original-image.html](https://blog.daliansky.net/macOS-Mojave-10.14.3-18D42-official-version-with-Clover-4859-original-image.html)

EFI使用：[https://github.com/SuperNG6/MSI-B360-10.14.3-EFI](https://github.com/SuperNG6/MSI-B360-10.14.3-EFI).  (bios版本为V13, 其他版本我这边会卡启动进度条)

安装流程就和视频差不多了，这里提几个注意点
1. 硬盘必须是GPT分区，不可以使用MBR，建议再安装前使用WIN下的`diskgenius`把磁盘格式化成对应的格式。
2. Clover是一个引导程序，在启动OSX之前会执行clover中对应的配置信息，因此配置要一定选对，尤其是显卡型号，这里I7 8700对应的是UHD630.
3. 安装完后配置引导主要是把clover放入到EFI分区中，然后让主板去该分区下加载clover，这样就能到clover的界面上。其他的EFI不需要理会，clover会自动收集所有硬盘的EFI引导信息，因此只要能引导到clover，那么就能通过clover引导进入任何系统。
4. 微星B360主板设置UEFI：Hard Disk后还需要再高级设置中配置UEFI的优先级，硬盘 BBR那个设置选项。

有问题欢迎留言交流(留言板需要fq)。

### 配置OSX
加上黑苹果，目前有三台OSX设备，因此装机初始化我是选择依赖于`brew`，启动OSX之后首先安装`brew`，然后执行初始化脚本即可。
由于脚本涉及到好多私人帐号信息，这里不放出了，大概思路是配置要安装的软件，然后安装之后扫描本地是否有配置脚本，有的话则执行配置脚本来配置。
![](http://imgblog.mrdear.cn/1550397633.png?imageMogr2/thumbnail/!100p)

**清单1: brew配置脚本示例**
```sh
#!/usr/bin/env bash

# 当前脚本所在目录
basePath=$(cd `dirname $0`; pwd)

# 整个初始化根目录
rootPath=$(cd `dirname $0`; cd ..; pwd)

# brew安装
installBrew(){
    # brew
#    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    # 替换brew源为国内
    ${basePath}/brew_proxy.sh
}

# dmg软件
DMG_SOFTWARE=(
"homebrew/cask-versions/java8" #java
"shadowsocksx-ng" # ss翻墙
"iina"  # 最强播放器
"phoenix" # js控制mac快捷键跳转
"appcleaner" # app清理工具
"iterm2" # 终端工具
"google-chrome" # chrome
"intellij-idea" # idea
"datagrip" # datagrip
"sequel-pro" # 数据库查询软件
"flux" # 护眼
"plistedit-pro" # 编辑list
"ezip" # 压缩软件
)

# 命令行软件
CMD_SOFTWARE=(
"telnet" # telnet
"wget" # 单线程下载工具
"axel" # 多线程下载工具
"golang" # go语言
"autojump" # zsh快捷工具
"zsh-syntax-highlighting" # zsh插件
"zsh-autosuggestions" # zsh插件
"nvm" # npm版本管理
"yarn" # yarn包管理工具
)

# 执行相应软件的配置脚本
resetConfig(){
    local softName=$1
    if [ ! -f "${rootPath}/${softName}/start.sh" ];then
        echo "${softName} 不需要配置"
    else
        echo "开始配置 ${softName} "
        ${rootPath}/${softName}/start.sh | echo
        echo "配置 ${softName} 完成"
    fi
}
# ------------------------

echo '开始安装brew...'
installBrew
echo '安装brew完毕'

# ------------------------

echo '开始安装命令行工具...'
for cmd in ${CMD_SOFTWARE[@]}
do
    (
        brew install ${cmd}
        resetConfig ${cmd}
    )
done
echo '安装命令行工具完毕'

# ------------------------

echo '开始安装DMG工具...'
for cmd in ${DMG_SOFTWARE[@]}
do
    (
        brew cask install ${cmd}
        resetConfig ${cmd}
    )
done
echo '安装DMG工具完毕'


echo '开始清理brew缓存...'
brew cleanup
echo '清理brew缓存完毕'
echo 'brew all finish'
```

### 配置Windows
Windows主要用来玩游戏，因此只需要一些使用习惯能和OSX下保持一致即可。

#### magic trackpad2支持
网上大神是真的多，有大佬开发了[http://extramagic.forbootcamp.org/](http://extramagic.forbootcamp.org/)，使用该软件能够让trackpad2在Win下90%完美，体验上不如Mac上自然，不过不是主力系统是可以接受的。(滚动方向这个软件也是支持的哈)

#### Ctrl  Alt改键映射
使用[注册表法](https://www.qiansw.com/windows-through-the-registry-to-make-ctrl-and-alt-swap.html),原代码如下：

**清单2: win下键盘映射reg脚本**
```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Keyboard Layout]
"Scancode Map"=hex:00,00,00,00,00,00,00,00,03,00,00,00,38,00,1D,00,1D,00,38,00,00,00,00,00
```

```txt
"Scancode Map"=hex:
00,00,00,00,  # 固定
00,00,00,00,  # 固定
04,00,00,00,  # 下面有4行
38,00,1D,00,  # Left Alt  ->  Left Ctrl
1D,00,38,00,  # Left Ctrl ->  Left Alt
00,00,00,00   # 固定
```

**键值对照表** [更多请参考](http://www.doc88.com/p-10453230875.html)
```txt
Escape             01 00
Tab          　　　 0F 00
Caps Lock          3A 00
Left Alt           38 00
Left Ctrl          1D 00
Left Shift         2A 00
Left Windows       5B E0
Right Alt          38 E0
Right Ctrl         1D E0
Right Shift        36 00
Right Windows      5C E0
Backspace          0E 00
Delete             53 E0
Enter              1C 00
Space              39 00
Insert             52 E0
HOME               47 E0
End                4F E0
Num Lock           45 00
Page Down          51 E0
Page Up            49 E0
Scroll Lock        46 00
```

### 其他

#### 显示器亮度以及声音调节
这里使用到了第三方软件，安装后即可调节。

软件地址： [https://github.com/JoniVR/MonitorControl](https://github.com/JoniVR/MonitorControl)
![](http://imgblog.mrdear.cn/1550843545.png?imageMogr2/thumbnail/!100p)

目前用起来挺完美的，后续有问题会继续更新该文章。

