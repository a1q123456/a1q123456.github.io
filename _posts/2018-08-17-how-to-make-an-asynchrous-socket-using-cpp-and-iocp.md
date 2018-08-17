---
title:  "C++-如何实现异步Socket 一、C++ Coroutine"
date:   2018-08-17 00:00:00
categories: C++
comments: true
---

# Coroutine

Coroutine已经确定将加入C++，很久以前Coroutine的概念在其他语言中已经出现，如C#/JS/Python的async/await。写过异步代码的同学一定见识过`Callback Hell`，async/await的出现就是为了避免这样的问题。它可以让异步回调代码看起来像同步代码，但实际上程序执行到await时将返回，不阻塞当前线程。

如下伪代码将演示什么是`Callback Hell`

```C++

void s1_callback(error_code ec);
void c1_callback(error_code ec);
void s2_callback(error_code ec);
void c2_callback(error_code ec);

auto s1_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S1_SIZE]);
auto self = shared_from_this();
read_async(socket, s1_buffer.get(), s1_buffer.size(), s1_callback);

void s1_callback(error_code ec)
{
    // do something

    auto c1 = make_handshake_c1();
    send_async(socket, c1.get(), c1.size(), c1_callback);
}

void c1_callback(error_code ec)
{
    // do something

    auto s2_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S2_SIZE]);
    read_async(socket, s1_buffer.get(), s1_buffer.size(), s2_callback);
}

void s2_callback(error_code ec)
{
    // do something

    auto c2 = make_handshake_c2();
    send_async(socket, c2.get(), c2.size(), c2_callback);
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
