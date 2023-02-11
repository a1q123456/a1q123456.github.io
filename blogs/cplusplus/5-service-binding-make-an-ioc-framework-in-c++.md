---
title:  "Creating a Dependency Injection Library in C++"
subtitle: "Part 3 Service Binding"
date:   2018-08-28 00:00:00
---

The previous article discusses how to determine the number of parameters a function accepts. This article discusses the implementation of dependency injection. 

`Bindings` may be used to describe the types of service interfaces and the types of implementations of services. Developers may use a template to create a `Binding` class.

# Implementation of a `Binding`

A simplest implementation of a `Binding` may look like the following:
```c++
template <typename T>
struct Binding
{
    using typename Type = T;
    std::function<T()> provider;
};

Binding<int> myBinding{[]{ return 10; }};
```
In the above example, the type alias `Type` is the type of a service interface; the `provider` is a provider that creates an implementation of the service type; the `myBinding` is a provider that returns an integer with a value of 10.

`Bindings` should be stored in the `PlaceHolder` type mentioned in the previous articles, which makes the `PlaceHolder` type an actual injector. Inside the injector, a container may store all the `Bindings` a program has. This article uses `std::tuple` as the container.

```c++
auto bindings = std::make_tuple(Binding<int>([]{ return 10; }), Binding<float>([] { return 2.1f; }));
```

The injector type needs to search through the container to find a suitable service provider for returning an instance of a service. In term of this, `std::is_same_v` may be used.

```c++
static_assert(std::is_same_v<int, int>); // Yes
static_assert(std::is_same_v<int, float>); // Not the same

using ABindingInTheTuple = Binding<T>;
static_assert(std::is_same_v<ABindingInTheTuple::Type, T>); // Yes
static_assert(std::is_same_v<ABindingInTheTuple::Type, U>); // No
```

With all the above knowledge, it is possible to create a `Injector`, like the following code:
```c++
template<typename...Services>
struct Injector
{
    std::tuple<Binding<Services>...> bindings;
    constexpr std::size_t servicesCount = sizeof...(Services);

    template<typename T, std::size_t...RestN>
    constexpr Binding<T> getBinding(std::index_sequence<N>)
    {
        if constexpr (std::is_same_v<decltype(std::get<N>(bindings))::Type, T>)
        {
            return std::get<N>(bindings);
        }
        else
        {
            static_assert(false);
        }
    }

    template<typename T, std::size_t...RestN>
    constexpr Binding<T> getBinding(std::index_sequence<N, RestN...>)
    {
        if constexpr (std::is_same_v<decltype(std::get<N>(bindings))::Type, T>)
        {
            return std::get<N>(bindings);
        }
        else
        {
            return getBinding(std::index_sequence<RestN...>{});
        }
    }

    template<typename T>
    T operator()()
    {
        return getBinding<T>(std::make_index_sequence(servicesCount)).provider;
    }
}
```

The above injector stores all the program's services in a `std::tuple` and uses `std::index_sequence` to search through the tuple and calls the provider function to create the implementation.
