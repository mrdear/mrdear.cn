---
title: Java--死锁以及死锁的排查
subtitle: 对于死锁的一些特征及其排查相关的知识点
cover: http://imgblog.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
  - JUC
categories: 夯实Java基础
urlname: java_deadlock
date: 2018-06-16 07:06:36
updated: 2018-06-16 07:06:41
---
最近遇到了死锁的问题，所以这里分析并总结下死锁，给出一套排查解决方案。

## 死锁示例一

**清单一**
```java
public class SynchronizedDeadLock {

  private static final Object lockA = new Object();
  private static final Object lockB = new Object();

  /**
   * ThreadA先获取lockA,在获取lockB
   */
  private static class ThreadA extends java.lang.Thread {

    @Override
    public void run() {
      // 获取临界区A
      synchronized (lockA) {
        System.out.println("get lockA success");
        // 模拟耗时操作
        try {
          Thread.sleep(500);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
        // 获取临界区B
        synchronized (lockB) {
          System.out.println("get lockB success");
        }
      }
    }
  }

  /**
   * ThreadB先获取lockB,在获取lockA
   */
  private static class ThreadB extends java.lang.Thread {

    @Override
    public void run() {
      // 获取临界区A
      synchronized (lockB) {
        System.out.println("get lockB success");
        // 模拟耗时操作
        try {
          Thread.sleep(500);
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
        // 获取临界区B
        synchronized (lockA) {
          System.out.println("get lockA success");
        }
      }
    }
  }
}
```
`清单一`代码有点长，但是逻辑很简单，有两个临界区变量`lockA`，`lockB`，线程A先获取到`lockA`在获取`lockB`，线程B则与之相反顺序获取锁，那么就可能会有以下情况：
线程A获取到`lockA`之后发现`lockB`已被线程B获取，那么此时线程A进入blocked状态。同理线程B获取`lockA`时发现其被线程A获取，那么线程B也进入blocked状态，那么这就是死锁。

可以总结下，这种类型的死锁源于锁的嵌套，由于线程与线程之间的互相看对方都是乱序执行，因此加锁的顺序和释放顺序都是难以保证的，锁的互相嵌套在多线程下是一个很危险的操作，因此需要额外注意。

## 死锁示例二
**清单二**
```java
public class TreeNode {
	TreeNode parent   = null;  
	List children = new ArrayList();

	public synchronized void addChild(TreeNode child){
		if(!this.children.contains(child)) {
			this.children.add(child);
			child.setParentOnly(this);
		}
	}
  
	public synchronized void addChildOnly(TreeNode child){
		if(!this.children.contains(child)){
			this.children.add(child);
		}
	}
  
	public synchronized void setParent(TreeNode parent){
		this.parent = parent;
		parent.addChildOnly(this);
	}

	public synchronized void setParentOnly(TreeNode parent){
		this.parent = parent;
	}
}

```

`清单2`的代码来自[并发编程网-死锁](http://ifeve.com/deadlock/)，下方代码可以理解为一个组合模式，那么在多线程的环境下如果线程1调用`parent.addChild(child)`方法的同时有另外一个线程2调用`child.setParent(parent)`方法，两个线程中的parent表示的是同一个对象，child亦然，此时就会发生死锁。下面的伪代码说明了这个过程：
```java
Thread 1: parent.addChild(child); //locks parent
          --> child.setParentOnly(parent);

Thread 2: child.setParent(parent); //locks child
          --> parent.addChildOnly()
```

也可以总结下：这种类型的死锁本质原因也是锁的嵌套问题，`child.setParent(parent)`该方法执行首先需要获取到child这个对象锁，然后其内部调用parent的方法则需要获取parent的对象锁，那么就形成了锁嵌套，因此会出现死锁。

## 死锁示例三
`清单三`是一种开发人员经常犯的错误,一般都是由于某些中断操作没有释放掉锁，所以也叫（`Resource deadlock`）比如下方的当i==5直接抛出异常，导致锁没有释放，所以对于资源释放语句一定要卸载finally中。
```java
  public void hello(int i) {
    LOCK.lock();
    System.out.println(Thread.currentThread().getName() + "--hello:"+i);
    // 异常抛出但是没有释放掉锁
    if (i == 5) {
      throw new IllegalArgumentException("抛出异常,模拟获取锁后不释放");
    }
    LOCK.unlock();
  }
```
这种死锁最可怕的地方是难以排查，使用jstack时无法分析出这一类的死锁，你大概能得到的反馈可能线程仍然处于RUNNABLE，具体排查方法看下方的死锁排查。

## 死锁的排查

### jstack or jcmd
`jstack`与`jcmd`是JDK自带的工具包，使用`jstack -l pid`或者`jcmd pid Thread.print`可以查看当前应用的进程信息，如果有死锁也会分析出来。比如`清单一`中的死锁会分析出以下结果：
```java
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007fbea28989b8 (object 0x000000076ac710a0, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007fbea480a158 (object 0x000000076ac710b0, a java.lang.Object),
  which is held by "Thread-1"

Java stack information for the threads listed above:
===================================================
"Thread-1":
	at cn.mrdear.custom.lock.SynchronizedDeadLock$ThreadB.run(SynchronizedDeadLock.java:72)
	- waiting to lock <0x000000076ac710a0> (a java.lang.Object)
	- locked <0x000000076ac710b0> (a java.lang.Object)
"Thread-0":
	at cn.mrdear.custom.lock.SynchronizedDeadLock$ThreadA.run(SynchronizedDeadLock.java:48)
	- waiting to lock <0x000000076ac710b0> (a java.lang.Object)
	- locked <0x000000076ac710a0> (a java.lang.Object)

Found 1 deadlock.
```
在分析中明确指出发现了死锁，是由于`Thread-1`与`Thread-0`锁的互斥导致的死锁。

有时候文件分析不是很容易看，此时可以借助一些工具来分析，比如[http://gceasy.io/](http://gceasy.io/)，其分析整理后使得结果更加容易看到。
![](http://imgblog.mrdear.cn/1529113829.png?imageMogr2/thumbnail/!100p)

### 资源死锁排查
由于资源没释放的死锁使用jstack等手段难以排查，这种棘手的问题一般要多次dump线程快照，参考[kabutz/DeadlockLabJavaOne2012](https://github.com/kabutz/DeadlockLabJavaOne2012)给出的经验主要有以下两种方式排查：
**能够控制资源死锁的情况：**
1. 在死锁前dump出线程快照
2. 在死锁后再次dump出线程快照
3. 两者比较

**已经死锁**
1. 每隔一段时间dump出线程快照
2. 对比找到不会改变的那些线程再排查问题

### 应用自行检查
在Java中提供了`ThreadMXBean`类可以帮助开发者查找死锁，该查找效果与jstack一致，对于资源释放不当死锁是无法排查的。
使用方法如`清单4`所示，要注意的是死锁的排查不是一个很高效的流程，要注意对应用性能的影响。
**清单四**
```java
    ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
    long[] threadsIds = threadMXBean.findDeadlockedThreads();
```

## 参考
[http://ifeve.com/deadlock/](http://ifeve.com/deadlock/)
[https://github.com/kabutz/DeadlockLabJavaOne2012](https://github.com/kabutz/DeadlockLabJavaOne2012)