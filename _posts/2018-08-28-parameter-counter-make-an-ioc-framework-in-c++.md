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

截至目前，我们已经可以*判断*一个类型能否被指定的参数个数构造以及每个参数的类型，下一个问题就在于如何准确的*获取*一个类型能被几个参数所构造，解决方案就是：`模板递归`

先撇开模板元编程，将问题简化。首先需要通过一个循环去判断一个类型能否被指定数量*N*的参数构造，如果不行，则*N + 1*，直到N等于最大参数个数为止。

伪代码如下：

## Step 1

```c++

#define MAX_PARAMETER_COUNT 10

template<typename T>
size_t get_parameter_count()
{
    for (size_t i = 0; i < MAX_PARAMETER_COUNT; i++)
    {
        // 尝试用i个PlaceHolder类型构造
        if (std::is_constructible<T, PlaceHolder...i>::value)
        {
            return i;
        }
    }
    static_assert(false, "cannot construct");
}
```

以上代码当然不可能工作，但是，只要经过函数式编程的思维改造为模板递归，就可以工作。

## Step2:

```c++
#define MAX_PARAMETER_COUNT 10

// 无实际用处的I参数
template<size_t I>
struct PlaceHolder
{
	template <typename  T>
	operator T()
	{
		return T();
	}
};


template<typename T, size_t N, std::size_t... I>
size_t get_parameter_count()
{
    if constexpr (std::is_constructible<T, PlaceHolder<I>...>::value)
    {
        return N;
    }
    else if constexpr (N == MAX_PARAMETER_COUNT)
    {
        static_assert(false, "cannot construct");
    }
    else
    {
        return get_parameter_count<T, N + 1>(std::make_index_sequence<N + 1>());
    }
}
```

首先，改造`PlaceHolder`类型，让它接受一个`size_t`类型的模板参数，这个参数不起到实际作用，只是用来扩展参数包。然后通过`0if constexpr`判断是否能被指定参数个数构造。


以上代码可以在C++17中工作，并且不是`constexpr`的函数，不过，`if constexpr`语句只是一种语法糖而已，我们可以进一步改造为更通用的代码：

## Step 3
```c++

#define MAX_PARAMETER_COUNT 10

template <typename T, std::size_t N>
constexpr size_t continue_if_not_constructible(std::true_type)
{
	return N;
}

template <typename T, std::size_t N>
constexpr size_t continue_if_not_constructible(std::false_type)
{
	return get_parameter_count_impl<T, N +1>(std::make_index_sequence<N + 1>());
}


template<typename T, size_t N, std::size_t... I>
constexpr size_t get_parameter_count_impl(std::index_sequence<I...>)
{
	static_assert(N != MAX_PARAMETER_COUNT, "cannot construct");
	return continue_if_not_constructible<T, N>(std::is_constructible<T, PlaceHolder<I>...>());
}

template <typename T>
constexpr size_t get_parameter_count()
{
	return get_parameter_count_impl<T, 1>(std::make_index_sequence<1>());
}
```

我们通过函数重载替换了`if constexpr`，然后稍微修改了一下代码，增加了一些易用性。

聪明的同学会发现这段代码还是有一个BUG，那就是，对于任意一个类型，只要能供被`Copy Constructor`、`Move Constructor`构造，那么`get_parameter_count`函数的返回值一定是1。示例代码如下：

```c++
struct Test
{
	// Test(const Test&) = delete;
	// Test(Test&&) = delete;
	Test(int, int, int, int) {}
};

// 结果是1
std::cout << get_parameter_count<Test>();

struct Test
{
	Test(const Test&) = delete;
	Test(Test&&) = delete;
	Test(int, int, int, int) {}
};

// 结果是4
std::cout << get_parameter_count<Test>();
```

为了解决这个问题，我们必须保证，`is_constructible<T, PlaceHolder>`的时候，不能调用到`Copy Constructor`以及`Move Constructor`。

## Step 4

```c++
template<typename U, size_t I>
struct PlaceHolder
{
	// 稍微修改一下PlaceHolder，令U为要注入的类型，利用SFINAE，禁用掉T == U的情况，这样PlaceHolder永远都不能转换为要注入的类型
	template <typename  T, typename = std::enable_if_t<!std::is_same_v<T, U>>>
	operator T()
	{
		return T();
	}
};

#define MAX_PARAMETER_COUNT 10

template <typename T, std::size_t N>
constexpr size_t continue_if_not_constructible(std::true_type)
{
	return N;
}

template <typename T, std::size_t N>
constexpr size_t continue_if_not_constructible(std::false_type)
{
	return get_parameter_count_impl<T, N +1>(std::make_index_sequence<N + 1>());
}


template<typename T, size_t N, std::size_t... I>
constexpr size_t get_parameter_count_impl(std::index_sequence<I...>)
{
	static_assert(N != MAX_PARAMETER_COUNT, "cannot construct");
    // 相应地，给PlaceHolder传入要注入的类型，防止PlaceHolder转换为这个类型
	return continue_if_not_constructible<T, N>(std::is_constructible<T, PlaceHolder<T, I>...>());
}

template <typename T>
constexpr size_t get_parameter_count()
{
	return get_parameter_count_impl<T, 1>(std::make_index_sequence<1>());
}

```
通过禁止PlaceHolder转换为要注入的类型，就可以防止`is_constructible<T, PlaceHolder>`判断为拷贝构造和移动构造的情况，这样无论要注入的类型有没有拷贝构造函数和移动构造函数，都可以实现注入。


以上就是我们的最终代码，我们可以通过以上代码获取参数的个数。下一步，我们需要结合现有的信息，增加Provider函数，实现用户自定义注入。


