---
title: OSX--OSX应用快速切换方案
subtitle: 日常工作下应用窗口切换使用方案
cover: http://imgblog.mrdear.cn/uPic/MAC-Hammerspoon.png-default
author: 
  nick: 屈定
tags:
  - osx
categories: 杂七杂八
urlname: osx_app_switcher
date: 2020-08-01 12:43:53
updated: 2020-08-01 12:43:56
---

在公司看到不少人还在用Dock切换程序，虽然每个人有自己的习惯，但对于IT人员来说，切换应用这种频繁的操作应该使用更加高效的方式代替，而高效的一个原则，双手无需离开键盘，这里分享下个人使用的方案(感谢堆糖同事，从他们身上学到了这些)，没有最好只有最适合自己，读者可以根据自己的需求选择。

## 对使用的程序分类

- 日常工作时常用类别：IntelliJ IDEA，VS Code，Microsoft Edge，Typora，Notion，微信等
  - 要求快捷键切换
- 不常用或者打开后不经常切换：音乐，提醒，Clean My Mac，坚果云等
  - 使用Alfred快速定位，打开后进入后台，唤醒也使用Alfred
- 偶尔一次使用： 迅雷，阿里旺旺，IINA，幕布
  - 使用alfred快速定位，用完就cmd + q清理

由上面可以总结为两种形式，一种是快捷键做到在各个窗口之间，一种是alfred定位程序，两种分别使用不同软件定制即可。

## 快捷键切换

快捷键切换是使用最频繁的场景，因此为了达到完美体验，我总结了以下流程图，流程图的原则是定位到不同的应用，不存在则启动应用，存在则切换到该应用，同时应对多屏幕下多窗口，多次相同快捷键能够在窗口之间互相切换。![](http://imgblog.mrdear.cn/uPic/mac-app-switch.png-default "")



我选择的软件是[hammerspoon](http://www.hammerspoon.org/)，该程序提供了lua脚本与mac os交互的能力，定制脚本如下所示，需要的可以根据自己需要改造。

```lua
--123
hs.hotkey.bind({ "alt" }, "1", function()
    toggleAppByBundleId("com.bohemiancoding.sketch3")
end)
hs.hotkey.bind({ "alt" }, "2", function()
    toggleAppByBundleId("com.sequelpro.SequelPro")
end)
-- qwe
hs.hotkey.bind({ "alt" }, "q", function()
    toggleAppByBundleId("com.tencent.qq")
end)
hs.hotkey.bind({ "alt" }, "w", function()
    toggleAppByBundleId("com.tencent.xinWeChat")
end)
hs.hotkey.bind({ "alt" }, "e", function()
    toggleAppByBundleId("com.apple.Notes")
end)
-- asd
hs.hotkey.bind({ "alt" }, "a", function()
    toggleAppByBundleId("com.microsoft.VSCode")
end)
hs.hotkey.bind({ "alt" }, "s", function()
    toggleAppByBundleId("com.apple.finder")
end)
hs.hotkey.bind({ "alt" }, "d", function()
    toggleAppByBundleId("com.microsoft.edgemac")
end)
-- zxc
hs.hotkey.bind({ "alt" }, "z", function()
    toggleAppByBundleId("notion.id")
end)
hs.hotkey.bind({ "alt" }, "x", function()
    toggleAppByBundleId("com.jetbrains.intellij")
end)

-- else
hs.hotkey.bind({ "alt" }, "m", function()
    toggleAppByBundleId("com.apple.mail")
end)


-- 鼠标位置
mousePositions = {}

function toggleAppByBundleId(appBundleID)
--    获取当前最靠前的应用,保存鼠标位置
    local frontMostApp = hs.application.frontmostApplication()
    local mainWindow = frontMostApp:mainWindow()
    if mainWindow:isStandard() then
        mousePositions[frontMostApp:mainWindow():id()] = hs.mouse.getAbsolutePosition()
    end

-- 两者重复时,寻找下一个该窗口
    if frontMostApp:bundleID() == appBundleID then
        local wf = hs.window.filter.new{frontMostApp:name()}
        local locT = wf:getWindows({hs.window.filter.sortByFocusedLast})
        if locT and #locT > 1 then
            local windowId = frontMostApp:mainWindow():id()
            for _, value in pairs(locT) do
                if value:id() ~= windowId then
                    value:focus()
                end
            end
        else
            frontMostApp:hide()
        end
    else
        -- 不存在窗口时,启动app
        local launchResult = hs.application.launchOrFocusByBundleID(appBundleID)

        if not launchResult then
            return
        end
    end

    -- 调整鼠标位置
    frontMostApp = hs.application.applicationsForBundleID(appBundleID)[1]

    local point = mousePositions[appBundleID]
    if point then
        hs.mouse.setAbsolutePosition(point)
        local currentSc = hs.mouse.getCurrentScreen()
        local tempSc = frontMostApp:mainWindow():screen()
        if currentSc ~= tempSc then
            setMouseToCenter(frontMostApp)
        end
        --    找不到则转移到该屏幕中间
    else
        setMouseToCenter(frontMostApp)
    end

end

function setMouseToCenter(frontMostApp)
    local mainWindow = frontMostApp:mainWindow()
    if not mainWindow then
        return
    end
    local mainFrame = mainWindow:frame()
    local mainPoint = hs.geometry.point(mainFrame.x + mainFrame.w /2, mainFrame.y + mainFrame.h /2)
    hs.mouse.setAbsolutePosition(mainPoint)
end
```

## Alfred切换

Alfred切换不需要配置什么了，下载Alfred后，唤醒窗口，输入关键字即可快速匹配跳转。

## 其他

有更好的方式，欢迎分享