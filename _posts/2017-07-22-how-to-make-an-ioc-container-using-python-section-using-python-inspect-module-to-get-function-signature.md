---
title:  "Python-如何实现一个依赖注入IOC容器 三：通过inspect模块获取函数签名"
date:   2017-07-22 00:00:00
categories: Python
comments: true
---

# 为什么需要获取函数签名

如果规定了类将自己的依赖都放置在构造函数的参数中的话，通过获取构造函数的签名，就可以获取类的依赖。
因此，第一步就是获取构造函数的签名。

# inspect模块

> The inspect module provides several useful functions to help get information about live objects such as modules, classes, methods, functions, tracebacks, frame objects, and code objects. For example, it can help you examine the contents of a class, retrieve the source code of a method, extract and format the argument list for a function, or get all the information you need to display a detailed traceback.

> inspect 模块提供了多种用来获取运行时对象，如模块、类、方法、函数、调用栈、栈帧以及代码对象的函数。
  例如，它可以帮助你测试类的内容，获取方法的代码，读取函数的参数，或获取所有你需要显示的调用栈的细节。
                                    —— Python 文档


关于inspect的文档，本文不再赘述，请参阅[inspect — Inspect live objects](https://docs.python.org/3/library/inspect.html)

# 获取参数以及参数类型

```python
def test(a: int):
    print(type(a))

```
函数可以很容易的获取自己的类型，但这还不够，必须要在函数外部获取函数的各种信息。
```python
def test(a: int):
    print(type(a))

inspect.signature(test)  # (a:int)


```

通过signature函数，可以获取对象的签名，signature函数返回一个Signature对象。
想要获取签名的细节，可以调用Signature::parameters属性，和Signature::return_annotations属性，以及Signature::bind属性。

```python
def test(a: int):
    print(type(a))
    return 1

signature = inspect.signature(test)

parameters = signature.parameters  # a: int

bind = signature.bind  # None

return_annotation = signature.return_annotation  # int

```

实现依赖注入需要获取参数的类型，因此需要调用parameters属性，parameters属性返回OrderedDict对象。
其中，key为参数名，value为参数的Parameter对象。Parameter对象提供了参数的元信息（如：类型，默认值，名称等），
通过Parameter对象的annotation属性，可以获取参数的Type Hinting。

因此，获取函数参数类型的完整代码如下：

```python
def test(a: int):
    print(type(a))
    return 1
    
parameters = inspect.signature(test).parameters

for name, parameter in parameters.items():
    TParameter = parameter.annotation
    parameterName = name

```