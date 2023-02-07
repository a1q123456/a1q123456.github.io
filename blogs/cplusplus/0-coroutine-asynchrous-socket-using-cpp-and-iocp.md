---
title:  "C++-基于coroutine的异步Socket 一、C++ Coroutine"
date:   2018-08-17 00:00:00
---

# Coroutine

Coroutine已经确定将加入C++，很久以前Coroutine的概念在其他语言中已经出现，如C#/JS/Python的async/await。写过异步代码的同学一定见识过`Callback Hell`，async/await的出现就是为了避免这样的问题。它可以让异步回调代码看起来像同步代码，但实际上程序执行到await时将返回，不阻塞当前线程。

如下伪代码将演示什么是`Callback Hell`

```c++

void s1_callback(error_code ec);
void c1_callback(error_code ec);
void s2_callback(error_code ec);
void c2_callback(error_code ec);

auto s1_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S1_SIZE]);
auto self = shared_from_this();

read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
    self->s1_callback();
}});

void s1_callback(error_code ec)
{
    // do something

    auto c1 = make_handshake_c1();
    send_async(socket, c1.get(), c1.size(), [=](){
        self->c1_callback();
    }});
}

void c1_callback(error_code ec)
{
    // do something

    auto s2_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S2_SIZE]);
    read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
        self->s2_callback();
    }});
}

void s2_callback(error_code ec)
{
    // do something

    auto c2 = make_handshake_c2();
    send_async(socket, c2.get(), c2.size(), [=](){
        self->c2_callback();
    }});
}

void c2_callback(error_code ec)
{
    if (validate(s1, c1, s2, c2))
    {
        start_session();
    }
    else
    {
        disconnect();
    }
}
```


不难看出，回调函数虽然可以实现异步，但是把代码变得非常难以阅读，使用asycn/await优化以后的代码如下：

```c++

BYTE s1_buffer[HANDSHAKE_S1_SIZE];

co_await read_async(socket, s1_buffer.get(), sizeof(s1_buffer));

auto c1 = make_handshake_c1();
co_await send_async(socket, c1.get(), c1.size());

BYTE s2_buffer[HANDSHAKE_S2_SIZE]);
co_await read_async(socket, s2_buffer.get(), sizeof(s2_buffer.size));

auto c2 = make_handshake_c2();
co_await send_async(socket, c2.get(), c2.size());

if (validate(s1, c1, s2, c2))
{
    start_session();
}
else
{
    disconnect();
}

```

通过对比两段代码，可以发现，使用了co_await的代码更加易读，C#中的async/await是将`await`后面的代码转换为回调函数，本质是一种语法糖，但C++中的`co_await`允许用户自己定义await时的行为。下一节会介绍如何定义`co_await`时的行为并通过C++ Coroutine实现await