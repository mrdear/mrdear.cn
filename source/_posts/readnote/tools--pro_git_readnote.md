---
title: 读书笔记 --《Pro Git》
subtitle: 读Pro Git的一些摘要以及自己的理解
cover: http://res.mrdear.cn/mrdearblog_pro_git.png
author: 
  nick: 屈定
tags:
  - 读书笔记
categories: 读书笔记
urlname: readnote-pro-git
date: 2018-10-21 11:32:01
updated: 2018-10-21 11:32:01
---

关于《Pro Git》的阅读笔记，查漏补缺，补充Git的相关知识。

## 资料
[Pro Git](https://git-scm.com/book/zh/v2)
[Git工作流指南](https://github.com/xirong/my-git/blob/master/git-workflow-tutorial.md)

## 对象模型

Git保存的并不是文件差异，而是一系列不同时刻的被修改文件的快照。可以把Git理解为一个本地的内容寻址文件管理系统，管理着众多版本的文件。
下图是Git保存的对象，其利用树结构指向不同的版本。
![](http://res.mrdear.cn/1539992969.png)

### Blob
Blob通常用来存储文件内容，做文件镜像使用。
![](http://res.mrdear.cn/1540046588.png)

### Tree
在工作区做的变更使用树形来维护，树可以指向Blob，也就是变更文件，或者指向其他的树来关联未变更的文件。
![](http://res.mrdear.cn/1540046709.png)

### Commit对象
Commit对象指向**一个**tree对象，另外Commit中还保存着相关提交者信息，以及上一个提交，一个Commit可能存在多个parent对象，比如两个分支汇聚到一点，产生的这个commit就会有两个parent。
![](http://res.mrdear.cn/1540046768.png)

### Tag
Tag指向一个Commit对象。
![](http://res.mrdear.cn/1540047016.png)

## 工作模型
Git的工作模型揭露了我们在git项目中所采取的操作造成的影响。
![](http://res.mrdear.cn/1540047257.png)

**Work Directory**：工作空间，就是被Git所管理的本地项目目录。
**Index**：可以理解为Git的暂存区。
**Head**：当前所在的分支，其指向当前已经commit的最新内容。

**1. 本地添加文件**
本地添加只会改变`work directory`
![](http://res.mrdear.cn/1540091450.png)

**2. git add**
添加到暂存区，本质上是把本地目录修改的文件copy一份到Index区域。
![](http://res.mrdear.cn/1540047927.png)

**3. git commit**
Commit之后Head对应的本地分支中也会多一份文件镜像。
![](http://res.mrdear.cn/1540047986.png)

了解了这些那么很多命令就很好理解了。

**1. git status**
status实际上就是比较三个空间的差异，Index区域使用绿色，work directory使用红色。

**2. git reset**
reset操作有三个等级，`--soft`下只会回滚HEAD区域的文件内容。`--mixed`会回滚HEAD以及INDEX区域的内容。`--hard`则会回滚全部区域的内容。

**3. git revert**
revert的操作可以理解在Work Directory把对应commit的修改全部撤销掉，然后添加到INDEX区域 ，最后合并到HEAD区域产生一个新的commit。

## 操作

### 删除已提交文件
```sh
git rm --cached <文件名>   # 从已提交的内容中删除文件，删除后重新提交即可删除远程仓库的该文件。
git rm <文件名>  # 与上述类似，不过会连本地文件一起删除
```

### 修补提交
工作中经常遇到提交了commit之后发现有东西忘记提交了，然后又起了一个commit，实际上可以通过修改最后一次提交方式搞定。
```sh
# 该命令本质是把暂存区的文件和最后一次提交并入一起，如果指定了文件名，则把该文件与最后一次提交并入一起。
git commit --amend [文件名] 
```

### 变基Rebase
![](http://res.mrdear.cn/1539960913.png)
当前在experiment分支，执行`git rebase master`，Git会进行如下操作：
1. 找到C4,C3最近的共同祖先C2
2. 找到C2-C4之间的所有变更文件，存为临时文件。
3. 将当前分支Head指向C3
4. 依次把临时文件应用在C3，这个过程中会产生冲突，产生则需要手动订正，然后`git rebase --continue`继续apply
![](http://res.mrdear.cn/1539961166.png)

Rebase原则：“只对尚未推送或分享给别人的本地修改执行变基操作清理历史，从不对已推送至别处的提交执行变基操作”

### pull --rebase
普通的`pull`=`fetch`+`merge`，`pull --rebase`=`fetch`+`rebase`

### reset --hard误操作
一个迭代分支可能是`C1 -> C2 -> C3`，然后执行`git reset --hard C1`，那么C2和C3的修改 就会丢失，此时没有指向他们的引用，不过因为Git每次都是镜像存储，因此只需要找到C2和C3对应的提交ID，即可恢复。
使用`git reflog`查看HEAD指针改变的历史记录，从中找到对应的CommitId，使用`“git branch newbranch commitId”`创建一个新的分支，指向该次提交，找回丢失的文件。
引用日志会被清理的，如果没有则可以使用`git fsck --full`，该命令列出所有未被其他对象指向的commitId。

### 大文件删除
假设某人误操作向Git中提交了大文件，产生了一个commit，然后删除了该大文件，又产生了一个commit，对于之后的人clone，由于要拉下来完整的变更，因此每次都需要下载含有大文件的镜像。
解决方案是找到大文件的历史提交，然后重写对应的提交以及之后的提交。
1. `git verify-pack -v .git/objects/pack/压缩pack.idx   | sort -k 3 -n  | tail -3`，pack指定你自己的，该命令列出比较大的一些commitId
2. `git rev-list --objects --all | grep commitId`,使用该命令查看该次commitId提交的大文件名称
3. `git log --oneline --branches -- 文件名`，使用该命令查看对该文件进行过改动的提交，记录下第一个改动的id
4. `git filter-branch --index-filter \  'git rm --ignore-unmatch --cached 文件名' -- 第一次改动Id^..`，执行该命令，重写第一次提交大文件之后的所有相关修改，使用`git rm --cached`来删除之前的提交记录。
5. `rm -rf .git/refs/original`，`rm -rf .git/logs`,`git gc`,移除包含有旧提交指针的文件，并且 重新打包。

### 撤销合并
有时候已经合并到了master分支，但是需要回滚代码，那么就涉及撤销操作。
#### revert方式
在git提交信息中，commit分为两种，一种是开发提交的commit，一种是merge产生的commit，对于merge commit一般会有两个parent节点。`git revert`一般有两种形式：
`git revert <commit id>`，撤销指定的commit，Git会把该commit的修改全部撤销，并产生一个新的commit。
`git revert -m 1 <merge commit id>`,-m参数表示两个合并父节点的第一个还是第二个，该操作会把对应的合并内容全部撤销，并产生一个新的commit。

注意revert掉的分支在此合并会出现无法合并的现象，因为撤销后被撤销的分支实际上与当前仓库没有文件关联，解决方案是撤销Revert节点，然后再次合并该分支。

#### reset方式
找到要回滚到的commit，然后使用`git reset --hard commitId`，切到对应的分支，然后`push -f`强制提交覆盖，该操作虽然能够回滚，但是会相当危险，强制覆盖会造成中间提交节点的信息丢失，分布式开发下谨慎操作。


