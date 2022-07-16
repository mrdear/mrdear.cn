---
title: Linux -- Expect Script入门
subtitle: 使用Expect解决交互式程序自动化问题
cover: https://imgblog.mrdear.cn/linux.png
author: 
  nick: 屈定
tags:
  - 实战
categories: 实战总结
urlname: linux-expect_script
date: 2022-07-16 11:25:12
updated: 2022-07-16 11:25:18
---

我们习惯于在Linux上使用shell脚本自动化一些重复性的人力工作，比如批量登录远程机器并执行指定命令，或者连接ftp服务器下载指定文件。这些场景下shell难以做到完全自动化，本质原因是ssh,ftp类似程序属于交互式程序，这些程序会交互式的期望用户输入信息并响应输入。因此expect诞生了，expect是一款专门控制交互式程序的程序，我们可以用expect模拟人与程序以及终端输出(stdout)的各种交互，从而节省大量重复性人力消耗，博主用的最多的就是自动通过跳板机登录开发机，然后切换到应用目录。

## Expect命令

|     Command      |                             解释                             |
| :--------------: | :----------------------------------------------------------: |
|      spawn       | 通常用来启动给定程序进程，并开始与之交互，比如 `spawn ssh user@host`启动ssh进程 |
|      expect      | expect命令会等待程序输出，匹配规则为正则表达式，停止条件为匹配到指定输出，程序输出结束仍然未匹配，或者达到超时时间 |
|   expect_user    | 对用户输入进行匹配，该指令会等待用户输入信息，然后按照指定模式将数据暂存到$expect_out数组变量中 |
|       send       | 将字符串输入到当前进程，该命令是交互式核心，用于模拟用户输入信息 |
|     interact     | 将当前进程的交互控制权转交给用户，转交给用户后，脚本不再继续执行 |
|    send_user     |            将信息发送到stdout，用于给用户信息提示            |
|       set        | 该指令既可以修改全局变量，比如`set timeout 10`修改超时时间，也可以获取命令行参数并赋值`set username [lindex $argv 0]`获取脚本参数 |
|      close       |                         关闭当前进程                         |
| [lindex $argv 0] | 获取脚本参数，0代表第一个参数，一般常配合set指令，这样后续脚本可以直接是用$xxx访问 |



一般一个简单的expect脚本通常是下列形式，首先指定shebang为expect程序，然后使用spawn启动交互式程序，使用expect确定启动成功，最后使用send发送要执行的命令。

```sh
#!/usr/bin/expect
spawn service username@ip_server
expect "last character of the command"
send "your command\r"
```

## Expect案例

Expect脚本更多的是通过实例学习，博主现在掌握的实例并不多，因此本文后续会将遇到的案例追加上来，以此作为样板，读者可以根据样例实现自己的自动化逻辑

### 简易登录ssh并执行命令

本案例从[How to Learn The Basics of Expect Script?](https://sysadminote.com/how-to-learn-the-basics-of-expect-script/)中摘抄出来，作为入门案例，描述了spawn，expect，send等指令的基本用法，详细分析写到注释中。

```sh
#!/usr/bin/expect -f
spawn ssh root@192.168.56.227 # 启动一个ssh进程
set timeout 5 # 设置全局expect超时时间，超过5s没匹配，则终止
expect "Password:" # 匹配程序输出，期望是login，这里匹配不成功，整个脚本不会继续
send "qwerty\r" # 执行到这里，说明expect匹配成功，send命令是向程序的输入发送qwerty，\r标识输入完毕
expect "*# " # 匹配默认shell
send "free -m\r" # 执行命令
expect "*# " # 匹配默认shell
send "exit\r"
```

![img](https://imgblog.mrdear.cn/uPic/linux-expect-2_1657938179.gif)

### expect解析用户参数

这个案例是大多数程序的前提，我们假设要实现一个自动化脚本，该脚本需要用户输入 host，user，password三个变量，当用户没有输入user或者password的时候，需要主动提醒，让其输入。

该脚本的核心为 **set 指令获取用户参数**，以及使用 **expect_user 匹配用户输入**

```sh
#!/usr/bin/expect
# 定义变量 机器、用户、密码
set host ""
set user ""
set password ""

# debug时使用
send_user "argc is $argc  argv is $argv \n"

# 解析参数
if { $argc == 3 } {
		# 输入值为3个变量，则各自赋值
    set host [lindex $argv 0]
    set user [lindex $argv 1]
    set password [lindex $argv 2]
} elseif { $argc == 2 } {
		# 输入值为2个变量，为host和user
    set host [lindex $argv 0]
    set user [lindex $argv 1]
} elseif { $argc == 1 } {
		# 输入值为1个变量，为host
    set host [lindex $argv 0]
} else {
    send_user "Invalid args!\n Usage: need \[target_home\] username password\n"
    exit
}
set timeout -1
# 如果账户密码为空
if { $user == "" } {
    # 获取用户名
    send_user "Enter your domain ID: "
    expect_user -re "(.*)\n" # 读取用户输入变量，并暂存到expect中
    set user "$expect_out(1,string)" # 从变量表中获取之前的输入，获取后清空
}
if { $password == "" } {
    # 获取密码
    stty -echo # （stty -echo是屏蔽输入回显）
    send_user "Enter your password: "
    expect_user -re "(.*)\n" 
    stty echo
    set password "$expect_out(1,string)"
}
# debug时使用
send_user "user is $user  passwd is $password \n"
```

![expect](https://imgblog.mrdear.cn/uPic/expect_1657942393.gif)

### 更加完善的登录ssh判断

该脚本相较于第一个登录案例，增加了变量，以及异常情况判断，主要用到的是**expect多分支**匹配。这三个案例加起来，博主觉得足以满足绝大多数情况了，况且还可以将shell和expect配合使用，在shell中调用expect脚本，以达到更加灵活的操作。

```sh
#!/usr/bin/expect
# 为缩短演示脚本长度，这里指定设置值，复杂情况可以配合上个案例获取参数
set host "192.168.2.1"
set user "quding"
set password "quding"

set timeout -1 # 设置不超时，否则自动中断

spawn ssh $user@$host # 发送登录指令

# 循环，直到登录成功
while {1} {
    # 根据返回结果发送相应命令
    expect {
        # 账户异常
        "Authentication failed*" {
            exit
        }
        # 添加known_ssh_host
        "(yes/no)?" {
            send "yes\n"; exp_continue
        }
        # 输入密码
        "password*:" {
            send "$password\n"
        }
        # 匹配到用户名登录成功
        "$user*]" {
            send_user "login success\n";
            break;
        }
    }
}
# 上面登录成功后，这里可以继续执行指令
send 'date \n'

# 恢复人工交互
interact
```



## 参考

[How to Learn The Basics of Expect Script?](https://sysadminote.com/how-to-learn-the-basics-of-expect-script/)

