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

# std::integer_sequence / std::index_sequence

接下来，要使用模板递归的方式，来判断类型能否被指定个数的ParameterPlaceholder构造。可以使用std::index_sequence来创造出指定个数个ParameterPlaceholder。


```c++

constexpr int MaxCtorParamNum = 10;

template<typename Ctor, **std::size_t = 0**>
struct PlaceHolder
{
    template<typename T, typename std::enable_if<!std::is_same_v<Ctor, T>, int>::type = 0>
    operator T()
    {
        return T{};
    }
};


template<typename T, std::size_t I>
constexpr std::size_t _getCtorParamNum(std::index_sequence<I>)
{
    static_assert(IsConstructiableWithNumArg<T>(std::make_index_sequence<I>()), "inject failed, please increase the value of MaxCtorParamNum");
    return I;
}

template<typename T, std::size_t I, std::size_t... RestI>
constexpr std::size_t _getCtorParamNum(std::index_sequence<I, RestI...>)
{
    if constexpr (IsConstructiableWithNumArg<T>(std::make_index_sequence<I>()))
    {
        return I;
    }
    else
    {
        return _getCtorParamNum<T>(std::index_sequence<RestI...>());
    }
}

template<typename T>
constexpr std::size_t GetCtorParamNum()
{
    return _getCtorParamNum<T>(std::make_index_sequence<MaxCtorParamNum + 1>());
}

```


为PlaceHolder增加一个std::size_t = 0的参数，然后把当前的index传递给PlaceHolder类型，最后通过C++的parameter pack **...**，将index_sequence以这种方式展开，就可以构造出来指定个数的PlaceHolder了，详细原理，可以参考[cppreference](https://en.cppreference.com/w/cpp/language/parameter_pack)

index_sequence每次递归以后，都把RestI传递下去，并构造出一个新的index_sequence，这个新的index_sequence会比之前的index_sequence少一个元素。最终就可以展开为

```c++

constexpr std::size_t _getCtorParamNum(std::index_sequence<11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<11>, PlaceHolder<10>, PlaceHolder<9>, PlaceHolder<8>, PlaceHolder<7>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<10, 9, 8, 7, 6, 5, 4, 3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<10>, PlaceHolder<9>, PlaceHolder<8>, PlaceHolder<7>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<9, 8, 7, 6, 5, 4, 3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<9>, PlaceHolder<8>, PlaceHolder<7>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<8, 7, 6, 5, 4, 3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<8>, PlaceHolder<7>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<7, 6, 5, 4, 3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<7>);
}
...
```

