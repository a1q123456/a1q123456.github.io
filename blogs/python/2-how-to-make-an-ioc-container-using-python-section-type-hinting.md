---
title:  "Python-如何实现一个依赖注入IOC容器 二：Type Hinting"
date:   2017-07-22 00:00:00
---

通过读取Type Hinting，就可以知道构造函数所依赖的类了。

# 什么是Type Hinting

回忆一下C语言
```c

float sum(float a, float b)
{
    return a + b;
}

```

C语言中，所有的变量、表达式、函数都有自己的*固定*类型，而在Python中，每个变量虽然有自己的类型信息，但变量的类型并不是固定的。

```python

def sum(a, b):  
    return a + b

type(sum(1, 2))  # int

type(sum(1.2, 2.3))  # float

b = 1  

type(b)  # int

b = 1.2  

type(b)  # float


sum(1, 2)  # 3

sum('a', 'bcd')  # not expected, value is 'abcd'

```

为了让函数的调用方明确的知道自己应该传递什么样的参数，Python3.5中加入了Type Hinting的支持。

```python

def sum(a: int, b: int):
    return a + b

sum('a', 'bcd')  # will be warned

```

Type Hinting 虽然不是强制要求的，但仍然可以指导变量的类型。在IDE的智能提示中很有用。
```python

l = ['a', 'b', 'c', 'd']


def xxx(arr):
    for i in arr:
        i.?  # type of i is unknown, cannot providing any suggestions

xxx(l)


def yyy(arr: List[str]):
    for i in arr:
        i.slice  # i may be a string, providing string suggestions

yyy(l)

```

关于Type Hinting 的文档，请参阅：[Support for type hints](https://docs.python.org/3/library/typing.html)