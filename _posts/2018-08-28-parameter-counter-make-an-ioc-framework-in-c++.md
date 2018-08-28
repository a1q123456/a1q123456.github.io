---
title:  "C++-使用C++实现依赖注入框架 二、Parameter Counter"
date:   2018-08-28 00:00:00
categories: C++
comments: true
---

要实现依赖注入，就必须获取要注入的类型的构造函数的参数类型以及参数个数。上一篇文章已经解决了获取参数类型的问题，现在，该研究如何获取参数个数了。

参数分为可选参数和必填参数，在C++中，带有默认参数的参数是可选参数，没有默认参数的参数是必填参数。那么，如何在没有反射的情况下准确的获取参数个数呢？

答案是不能。

想在没有反射的情况下获取参数个数，唯一的办法就是使用不同的参数个数去尝试构造。这样的弊端在于，假如一个类型的构造函数有默认参数，或参数个数超过了尝试的上限，那么这样的办法就不能准确的获取参数个数了。

为了测试一个类型能否被制定的参数构造，我们需要使用std::is_constructible

# std::is_constructible<T, Args...>

```c++
struct A
{
    A(int, int) {}
}

// yes
static_assert(std::is_constructible<A, PlaceHolder, PlaceHolder>::value, "constructible"); 
```

