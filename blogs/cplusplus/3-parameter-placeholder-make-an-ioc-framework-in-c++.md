---
title:  "Creating a Dependency Injection Library in C++"
subtitle: "Part 1 Parameter Placeholders"
date:   2018-08-26 00:00:00
---

In other programming languages, developers use the reflection mechanism to implement dependency injection libraries. However, the static reflection features have not been added to C++ yet. However, it does not mean there are no ways to achieve it in C++. This article is to discuss a new method being able to achieve dependency injection in C++.

The most challenging part of doing dependency injection is getting the type of services needed by the class being injected. There are no ways to do this in C++. However, developers may use template meta-programming and implicitly type conversion to achieve it.

Imagine type `PlaceHolder` can be converted to any other type, and type `A` accepts four different types of parameters to construct itself, then four objects of `A` can be used to create an instance of type `B`.

E.g.

```c++

struct A
{
    A(int, bool, double, int)
    {

    }
};

// The normal way to create an object of `A`
A a(1, true, 1.2, 3); 

struct PlaceHolder
{
    // The type `PlaceHolder` now supprts to be converted to any types
    template <typename  T>
    operator T()
    {
        // Return an object of `T`
        return T{};
    }
}

// It is still valid.
// The compiler calls `operator T()` to convert `PlaceHolder{}` 
// to an int value, a bool value, a double value and an int value.
A a(PlaceHolder{}, PlaceHolder{}, PlaceHolder{}, PlaceHolder{});

```

In the above case, the `PlaceHolder` type can be used as an `Injector` to inject `A`. Now, the only issue is getting the number of parameters that the constructor of `A` accepts.
