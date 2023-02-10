---
title:  "Creating a Dependency Injection Library in C++"
subtitle: "Parameters Counter"
date:   2018-08-28 00:00:00
---

The previous article has solved the difficulty of retrieving the types of services that a type being injected needs. This article discusses how to get the **number** of services (parameters) that a type being injected needs.

Constructors in C++ can have both required and optional parameters and multiple overload constructors. Because of this, it is impossible to get the number of parameters that a constructor needs accurately.

To inaccurately get the parameters a constructor needs, developers may ask the compiler if a type can be constructed with a specific list of arguments. If the constructor accepts a list of arguments, then the length of the list is the number of parameters the constructor needs. However, this only works if a constructor has optional parameters or multiple overload constructors.

`std::is_constructible` can be used to check if a specific list of arguments can construct a type.

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

Then, with the type mentioned in the first article, `PlaceHolder` and `std::integer_sequence` and recursive template functions, it is possible to use `std::is_constructible` to get the number of parameters a constructor needs.
```c++

constexpr int MaxCtorParamNum = 10;

template<typename Ctor, std::size_t = 0>
struct PlaceHolder
{
    template<typename T, typename std::enable_if<!std::is_same_v<Ctor, T>, int>::type = 0>
    operator T()
    {
        return T{};
    }
};

template<typename T, size_t... I>
constexpr bool IsConstructiableWithNumArg(std::index_sequence<I...>)
{
    return std::is_constructible<T>(PlaceHolder<I>...);
}

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

The second template parameter, `size_t = 0` of the `PlaceHolder` type, allows the `PlaceHodler` type to work with `std::index_sequence`. So when `GetCtorParamNum` gets executed, it creates a `std::index_sequence` object, then the `_getCtorParamNum` function takes each index stored in `std::index_sequence` itself and expands the index to an argument list with the number of indexes arguments of `PlaceHolder<I>`.

An article on [cppreference](https://en.cppreference.com/w/cpp/language/parameter_pack) describes this mechanism.

`_getCtorParamNum` passes `RestI` down to itself and creates a new `index_sequence` with one element less than the existing `index_sequence` object every time the function recurses. The call stack can be expanded as the following code:
```c++

constexpr std::size_t _getCtorParamNum(std::index_sequence<3, 2, 1>)
{
    std::is_constructible<T>(PlaceHolder<11>, PlaceHolder<3>, PlaceHolder<2>, PlaceHolder<1>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<2, 1>)
{
    std::is_constructible<T>(PlaceHolder<9>, PlaceHolder<2>, PlaceHolder<1>);
}
constexpr std::size_t _getCtorParamNum(std::index_sequence<1>)
{
    std::is_constructible<T>(PlaceHolder<1>);
}
...
