---
title: Java--为什么需要主动关闭文件？
subtitle: 关于Java中资源释放的一些思考。
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
categories: 夯实Java基础
urlname: java_close_file
date: 2018-08-04 08:08:40
updated: 2018-08-04 08:08:43
---
在Java编程中，对于一些文件的使用往往需要主动释放，比如`InputStream`，`OutputStream`，`SocketChannel`等等，那么有没有想过为什么要主动释放这些资源？难道GC回收时不会释放吗？本文主要是对这一系列问题分析解答。（本文所使用的环境默认为Linux）

## 应用是如何操作文件的？
在Linux系统中有一种一切皆文件的说法，无论是真实的文件，还是网络的Socket连接，或者是挂载的磁盘等等，操作系统所规定只要内核才有权限操作这些文件，应用的文件操作则必须委托操作系统内核来执行，这也是常说的内核态与用户态。那么在内核与应用之间就需要有一个关联关系，来标识用户所要操作的文件，在Linux下就是文件描述符。换句话说文件描述符的存在是为应用程序与基础操作系统之间的交互提供了通用接口。
引用[网上一张图片](https://blog.csdn.net/cywosp/article/details/38965239)
![](http://res.mrdear.cn/1533374536.png?imageMogr2/thumbnail/!100p)
那么由图可知以下特性：
- 每一个进程有自己的文件描述符表
- 不同的描述符可能指向同一个文件，文件描述符这个数字只是针对当前进程有意义。

## Java是如何操作文件的？
在Java中对文件的操作都是通过`FileDescriptor`，然后JNI调用对应的C代码，在调用系统函数来进行操作，下面会详细分析下具体实现方式。

### FileInputStream的创建
在Java中打开一个文件一般使用`FileInputStream`，其主要属性字段如下：

**清单1：FileInputStream的属性字段**
```java
  // 文件描述符
private final FileDescriptor fd;
// 文件路径
private final String path;
// 文件Channel,后面再说
private FileChannel channel = null;
// 文件关闭锁
private final Object closeLock = new Object();
// 文件关闭标识
private volatile boolean closed = false;
```
其中`FileDescriptor`文件描述符就是Java与操作系统之间关于文件的连接，那么`FileDescriptor fd;`是在什么时候赋值的呢？[这里取自YuKai's blog相关内容](http://yukai.space/2017/07/07/java%E6%96%87%E4%BB%B6%E6%8F%8F%E8%BF%B0%E7%AC%A6/)

**清单2：FileInputStream打开一个文件**
```java
public FileInputStream(File file) throws FileNotFoundException {
        String name = (file != null ? file.getPath() : null);
        SecurityManager security = System.getSecurityManager();
        if (security != null) {
            security.checkRead(name);
        }
        if (name == null) {
            throw new NullPointerException();
        }
        if (file.isInvalid()) {
            throw new FileNotFoundException("Invalid file path");
        }
        fd = new FileDescriptor();
        fd.incrementAndGetUseCount();
        this.path = name;
        open(name);
}
static {
    initIDs();
}
```
注意到`initIDs()`这个静态方法：

**清单3：FileInputStream initIDs方法**
```java
jfieldID fis_fd; /* id for jobject 'fd' in java.io.FileInputStream */
JNIEXPORT void JNICALL
Java_java_io_FileInputStream_initIDs(JNIEnv *env, jclass fdClass) {
    fis_fd = (*env)->GetFieldID(env, fdClass, "fd", "Ljava/io/FileDescriptor;");
}
```
在`FileInputStream`类加载阶段，`fis_fd`就被初始化了，`fid_fd`相当于是`FileInputStream.fd`字段的一个内存偏移量，便于在必要时操作内存给它赋值。
看一下`FileDescriptor`的实例化过程：

**清单4：FileDescriptor实例化过程**
```java
public /**/ FileDescriptor() {
        fd = -1;
        handle = -1;
        useCount = new AtomicInteger();
}
static {
    initIDs();
}

// initIDs()方法对应C代码
/* field id for jint 'fd' in java.io.FileDescriptor */
jfieldID IO_fd_fdID;
/**************************************************************
 * static methods to store field ID's in initializers
 */
JNIEXPORT void JNICALL
Java_java_io_FileDescriptor_initIDs(JNIEnv *env, jclass fdClass) {
    IO_fd_fdID = (*env)->GetFieldID(env, fdClass, "fd", "I");
}
```
`FileDescriptor`也有一个`initIDs`，他和`FileInputStream.initIDs`的方法类似，把设置`IO_fd_fdID`为`FileDescriptor.fd`字段的内存偏移量。
接下来再看`FileInputStream`构造函数中的`open(name)`方法，字面上看，这个方法打开了一个文件，他也是一个本地方法，open方法直接调用了fileOpen方法，fileOpen方法如下:

**清单5：FileInputStream打开文件C代码**
```java
void fileOpen(JNIEnv *env, jobject this, jstring path, jfieldID fid, int flags)
{
    WITH_PLATFORM_STRING(env, path, ps) {
        FD fd;
#if defined(__linux__) || defined(_ALLBSD_SOURCE)
        /* Remove trailing slashes, since the kernel won't */
        char *p = (char *)ps + strlen(ps) - 1;
        while ((p > ps) && (*p == '/'))
            *p-- = '\0';
#endif
        // 打开一个文件并获取到文件描述符
        fd = handleOpen(ps, flags, 0666);
        if (fd != -1) {
            // 设置文件描述符
            SET_FD(this, fd, fid);
        } else {
            throwFileNotFoundException(env, path);
        }
    } END_PLATFORM_STRING(env, ps);
}

// 因为initIDs方法拿到了对应字段的引用，因此这里直接设置文件描述符
#define SET_FD(this, fd, fid) \
    if ((*env)->GetObjectField(env, (this), (fid)) != NULL) \
        (*env)->SetIntField(env, (*env)->GetObjectField(env, (this), (fid)),IO_fd_fdID, (fd))
```
打开一个文件本质上是调用操作系统指令，然后获取一个**文件操作符整数，再设置到对应的Java变量上**，那么接下来的读取写入关闭等等都是通过文件描述符来调用系统命令处理。

### FileChannel创建
`FileChannel`的创建依赖于`FileDescriptor`，其本质仍然是对文件操作符的处理，不过在处理方式上使用零拷贝等技术加速对文件的操作

**清单6：FileChannel的创建**
```java
    public FileChannel getChannel() {
        synchronized (this) {
            if (channel == null) {
                channel = FileChannelImpl.open(fd, path, true, false, this);
            }
            return channel;
        }
    }
```
### Socket的创建
在`SocketChannelImpl`中，socket的建立最终返回的也是`FileDescriptor`，然后应用程序的操作都会通过`FileDescriptor`映射到对应的socket上。

**清单7：SocketChannel的创建**
```java
 SocketChannelImpl(SelectorProvider var1) throws IOException {
    super(var1);
    this.fd = Net.socket(true);
    this.fdVal = IOUtil.fdVal(this.fd);
    this.state = 0;
  }
```

## 没有主动关闭文件的后果
由上面的分析可以得出，Java中对文件的操作本质都是获取文件操作符在调用系统命令处理，关闭文件本质上也是调用C提供的`close(fd)`方法，如下代码所示：

**清单8：JDK关闭一个文件**
```java
void
fileClose(JNIEnv *env, jobject this, jfieldID fid)
{
    FD fd = GET_FD(this, fid);
    if (fd == -1) {
        return;
    }
    // 设置Java对象的fd为-1
    SET_FD(this, -1, fid);

    // 对于标准输入，输出，错误不关闭，指向/dev/null
    if (fd >= STDIN_FILENO && fd <= STDERR_FILENO) {
        int devnull = open("/dev/null", O_WRONLY);
        if (devnull < 0) {
            SET_FD(this, fd, fid); // restore fd
            JNU_ThrowIOExceptionWithLastError(env, "open /dev/null failed");
        } else {
            dup2(devnull, fd);
            close(devnull);
        }
    // 调用close(fd)方法关闭
    } else if (close(fd) == -1) {
        JNU_ThrowIOExceptionWithLastError(env, "close failed");
    }
}
```

那么不关闭有什么后果呢？
- 不关闭就造成文件描述符无法释放，属于一种系统文件的浪费
- 不关闭可能造成对文件的写入丢失，写入有可能存在缓存区，没有关闭并且没有主动flush到具体的文件上，则可能造成丢失。
- 如果该文件被文件锁独占，那么就会造成其他线程无法操作该文件。
- Too many open files错误，操作系统针对一个进程分配的文件描述符表是有限大小的，因此打开不释放可能造成该表溢出。

## 对象被GC后文件会被关闭吗？
答案是不确定，GC理论上管理的是内存中的对象，并不会理会文件文件，并且GC具有不确定性。在Java中对象被释放之前会调用`finalize()`方法，因此JDK的一些实现会在该方法中加入关闭操作，比如`FileInputStream`，这是JDK对程序员可能犯不关闭文件的一种补偿操作。

**清单9：FileInputStream的finalize实现**
```java
protected void finalize() throws IOException {
        if ((fd != null) &&  (fd != FileDescriptor.in)) {
            /* if fd is shared, the references in FileDescriptor
             * will ensure that finalizer is only called when
             * safe to do so. All references using the fd have
             * become unreachable. We can call close()
             */
            close();
        }
    }
```
因此最好的做法是养成用完文件就关闭的好习惯，对于Java来说自然是放在`finally`块中关闭最为可靠，依赖GC去关闭是相当不可靠的做法。
