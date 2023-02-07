---
title: "C++-使用C++实现依赖注入框架 三、Type Binding"
date:   2018-08-28 00:00:00
---

上一节我们已经找到了获取构造函数参数个数的方法，现在，我们要继续依赖注入的实现。那就是，绑定一个类型到一个返回该类型的Provider函数。

我们可以把类型和Provider之间的关系称为`Binding`，一个`Binding`上将保存了类型元数据和Provider对象。那么，如何实现这样的一个`Binding`呢？答案还是模板元编程。

# Binding的实现

```c++
template <typename T>
struct Binding
{
    std::function<T()> provider;
};

Binding<int>{[]{ return 10; }};
```

以上是一个最简单的`Binding`的实现，下一步，我们需要将Binding保存到一个编译期容器中，在注入类型的时候，遍历这个容器，找到合适的`Binding`，并调用对应的`Provider`。不难想到，这个容器的最佳选项就是`std::tuple`。

```c++
auto bindings = std::make_tuple(Binding<int>([]{ return 10; }), Binding<float>([] { return 2.1f; }));
```

我们可以通过这样的方式，将Binding保存在tuple中，下一步，就是判断一个类型是否对应一个`Binding`了。

要判断一个类型是否对应一个`Binding`，就是要判断`Binding<T>`中的`T`是否是这个类型。现在，我们不难联想到C++的type_traits中的`std::is_same`，`std::is_same`的实现大致如下：

```c++
template <typename T, typename U>
struct is_same : false_type {};

template <typename T>
struct is_same<T, T> : true_type {};
```

利用模板偏特化，假如T和U是两个类型，就会匹配到第一个重载，假如T和U是同一个类型，就会匹配到第二个重载。

相应地，要判断`Binding<T>`中的`T`是否与要注入的类型相同，也可以借鉴这种思路。

```c++
template <typename Binding<T>, typename U>
struct is_binding_same : false_type {};

template <typename T>
struct is_binding_same<Binding<T>, T> : true_type {};

```
这样，就可以判断`Binding<T>`中的T是否为需要的类型了。下一步，我们需要在PlaceHolder中遍历tuple中的每一个Binding，判断Binding是否为需要的类型， 假如是，则调用Binding::provider，假如不是，则忽略。

