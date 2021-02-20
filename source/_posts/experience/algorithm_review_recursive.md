---
title: 实践--如何写递归?
subtitle: 递归程序的写法也是有迹可循的,本篇学习如何正确的思考程序递归.
cover: http://imgblog.mrdear.cn/1519217222.png
author: 
  nick: 屈定
tags:
  - 算法
categories: 杂七杂八
urlname: work-design-algorithm-recursive
date: 2018-02-21 08:02:28
updated: 2018-02-21 08:02:32
---
<!-- toc -->
- - - - -

### 递归书写方法
1. 严格定义递归函数作用,包括参数,返回值,side effect
2. 先**一般**再**特殊**
3. 每次递归必须缩小问题规模
4. 每次问题规模缩小程度必须为1

总之递归就是"装傻"的把原始的思路表现出来,不需要关心具体过程,只需要不停的缩小问题规模,然后答案自然就会被计算出来.

### 举例

#### 斐波那契数列
问题描述求出斐波那契数列第n位数值,也就是f(n).
按照题目意图,递归函数为 f(n),其中n为要求出值的索引位置.
```go
func fibonacci(n int) int {
}
```
先考虑一般情况,且每一次递归都要缩小规模,对于斐波那契数列其`f(n) = f(n-1)+f(n-2)`,那么就可以写出下列函数
```go
func fibonacci(n int) int {
	return fibonacci(n-1) + fibonacci(n-2)
}
```
在考虑特殊情况,一般特殊情况即递归的结束条件,对于斐波那契数列为第一位以及第二位为1,也就是n小于3返回1,到此完成了该题.
```go
func fibonacci(n int) int {
	if n < 3 {
		return 1
	}
	return fibonacci(n-1) + fibonacci(n-2)
}
```
#### 汉诺塔问题
　从左到右有A、B、C三根柱子，其中A柱子上面有从小叠到大的n个圆盘，现要求将A柱子上的圆盘移到C柱子上去，期间只有一个原则：一次只能移到一个盘子且大盘子不能在小盘子上面，求移动的步骤和移动的次数

首先要明确当n>2的时候,必须借助B柱子才能实现从A到C,具体怎么移动不需要关心.
根据题意定义出函数
```go
/**
 * 将n个盘子从A上借助B移动到C
 **/
func hanoi(n int, A string, B string, C string){
}
```
那么对于n个柱子从A到C上,自然先把n-1个柱子从A到B上,然后再把第n个柱子移动到C上.
```go
func hanoi(n int, A string, B string, C string) {
	hanoi(n-1, A, C, B)
	fmt.Println("从" + A + "上移动" + (strconv.Itoa(n - 1)) + "借助" + B + "到" + C)
	count++
}
```
那么移动完第n个柱子后,接下来的问题规模变成了把n-1个柱子从B移动到C上,自然在上述操作最后加上这步操作
```go
func hanoi(n int, A string, B string, C string) {
	hanoi(n-1, A, C, B)
	fmt.Println("从" + A + "上移动" + (strconv.Itoa(n - 1)) + "借助" + B + "到" + C)
	count++
     // 把n-1个柱子从B移动到C上,
	hanoi(n-1, B, A, C)
}
```
考虑特殊情况,当只有一个盘子的时候,也就是n为1,那么直接移动即可.
```go
func hanoi(n int, A string, B string, C string) {
	if n == 1 {
		count++
		fmt.Println("从" + A + "上移动" + (strconv.Itoa(n - 1)) + "到" + C)
		return
	}
	hanoi(n-1, A, C, B)
	fmt.Println("从" + A + "上移动" + (strconv.Itoa(n - 1)) + "借助" + B + "到" + C)
	count++
	hanoi(n-1, B, A, C)
}
```
整个流程结束,我们并没有关心具体的移动是怎么进行的,只需要知道大概步骤,不停地缩小问题规模就可以完成.
#### 二路归并排序
归并排序是分治思想的体现,能分治解决的问题绝大多数可以递归解决,其实递归不断缩小问题规模本身也是分治思想.
那么先定义归并函数对一个数组排序.
```go
func mergesort(arr []int) []int {
}
```
然后策略,归并是不停地拆分数组,当数组足够小且方便排序的时候为止,然后把问题转换成有序数组的合并.这里数组拆分为只有一个元素为止,那么其必然有序.
那么思路,拆分数组为两个数组,然后合并
```go
func mergesort(arr []int) []int {
	arrLen := len(arr)
	//拆分arr1
	arr1 := mergesort(arr[:arrLen/2])
	//拆分arr2
	arr2 := mergesort(arr[arrLen/2:])
	// merge arr1 arr2,是两个有序集合的合并.
	return merge(arr1, arr2)
}
```
特殊情况,当数组长度为1的时候,即此时是有序的,直接返回合并即可
```go
func mergesort(arr []int) []int {
	arrLen := len(arr)
	if arrLen == 1 {
		return arr
	}
	//拆分arr1
	arr1 := mergesort(arr[:arrLen/2])
	//拆分arr2
	arr2 := mergesort(arr[arrLen/2:])
	// merge arr1 arr2,两个有序集合的合并.
	return merge(arr1, arr2)
}
```
那么归并排序就完成了,还剩下一个问题`func merge(arr1 []int, arr2 []int) []int`两个有序数组合并成一个有序数组,也就是归并.
```go
func merge(arr1 []int, arr2 []int) []int {
	var newArr []int
	indexArr2 := 0
	indexArr1 := 0

	for ; indexArr1 < len(arr1) && indexArr2 < len(arr2); {
		if arr1[indexArr1] > arr2[indexArr2] {
			newArr = append(newArr, arr2[indexArr2])
			indexArr2++
		} else {
			newArr = append(newArr, arr1[indexArr1])
			indexArr1++
		}
	}
	// 遍历完情况
	if len(arr2) > indexArr2 {
		newArr = append(newArr, arr2[indexArr2:]...)
	}
	if len(arr1) > indexArr1 {
		newArr = append(newArr, arr1[indexArr1:]...)
	}
	return newArr
}
```
#### 全排列问题
> 
        如下的10个格子
           +--+--+--+
           |  |  |  |
        +--+--+--+--+
        |  |  |  |  |
        +--+--+--+--+
        |  |  |  |
        +--+--+--+
        （如果显示有问题，也可以参看下图）
        填入0~9的数字。要求：连续的两个数字不能相邻。
        （左右、上下、对角都算相邻）
        一共有多少种可能的填数方案？
        请填写表示方案数目的整数。
        注意：你提交的应该是一个整数，不要填写任何多余的内容或说明性文字。 

这是2016蓝桥杯B组一道题,当时年少无知没做出来(笑哭)......
思路暴力方法最简单,每个数都在方格试试....
根据题意定义函数,在数组位置填充数组,为了简单我把数组直接用初始值声明好了,其中-5代表不用填写的两个格子.
```go
var arr = [3][4]int{
	{-5,-2,-2,-2},
	{-2,-2,-2,-2},
	{-2,-2,-2,-5},
}

func fillGrid( y int, x int) {
}
```
然后循环0-9,一个一个的试试.其中`visit数组`记录该元素是否已经填充过.`check函数`则检查条件上下左右以及对角线是否相邻,很简单的函数,不贴代码了.
```go
func fillGrid( y int, x int) {
	for i := 0; i <= 9; i++ {
		// check
		if visit[i] != 0 || !check(y, x, i) {
			continue
		}
		//填入值
		arr[y][x] = i
       //标记该值已访问
		visit[i] = 1
		//下一个坑填入
		if x == 3 {
			fillGrid( y+1, 0)
		} else {
			fillGrid( y, x+1)
		}
        //恢复数据
		arr[y][x] = -2
		visit[i] = 0
	}
}
```
特殊情况考虑,也就是递归的结束条件,当遍历到最后一个格子`arr[2][3]`时则结束.
```go
func fillGrid( y int, x int) {
	if y == 2 && x == 3 {
		total++
		return
	}
	for i := 0; i <= 9; i++ {
		// check
		if visit[i] != 0 || !check(y, x, i) {
			continue
		}
		//填入值
		arr[y][x] = i
            //标记该值已访问
		visit[i] = 1
		//下一个坑填入
		if x == 3 {
			fillGrid( y+1, 0)
		} else {
			fillGrid( y, x+1)
		}
           //恢复数据
		arr[y][x] = -2
		visit[i] = 0
	}
}
```

到此完成遍历.直接从第二个格子开始填值`fillGrid(0,1)`即可得到答案1580.

### 备注
1.实例写法只是怎么便于理解怎么写,不涉及各种优化,比如归并可以使用一个数组逻辑上当成多个数组使用,这样只会带来额外的理解成本,保证先写出来,思路是对的,然后再考虑优化.

2.代码都是golang编写,最近才开始学习的go,使用不当之处还请指出.
