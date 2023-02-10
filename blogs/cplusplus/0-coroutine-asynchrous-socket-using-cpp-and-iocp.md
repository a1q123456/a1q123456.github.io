---
title:  "Asynchronous Socket with C++ Coroutine TS"
subtitle: "Part 1 Coroutines in C++"
date:   2018-08-17 00:00:00
---

# The coroutine

Finally, the coroutine feature is set to add to C++. But wait, what does the coroutine do, and why should we use it? The coroutine feature solves the `Callback hell` issue, which most front-end developers probably have experienced. It basically makes the asynchronous code looks like synchronised code but without blocking the executing thread.

The following code is from a socket server, which uses callback functions to handle new connections with a very basic handshake validation. It basically shows how the `Callback hell` destroys developers' minds.

```c++

void s1_callback(error_code ec);
void c1_callback(error_code ec);
void s2_callback(error_code ec);
void c2_callback(error_code ec);

void handle_connection()
{
    auto s1_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S1_SIZE]);
    auto self = shared_from_this();

    read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
        self->s1_callback();
    });
}

void s1_callback(error_code ec)
{
    // do something

    auto c1 = make_handshake_c1();
    send_async(socket, c1.get(), c1.size(), [=](){
        self->c1_callback();
    });
}

void c1_callback(error_code ec)
{
    // do something

    auto s2_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S2_SIZE]);
    read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
        self->s2_callback();
    });
}

void s2_callback(error_code ec)
{
    // do something

    auto c2 = make_handshake_c2();
    send_async(socket, c2.get(), c2.size(), [=](){
        self->c2_callback();
    });
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

Clearly, those callback functions have made the code hard to follow and unnecessarily split a whole piece of logic into a lot of functions just for the mechanism.

With the coroutine feature, we could refactor the above code to this:

```c++

BYTE s1_buffer[HANDSHAKE_S1_SIZE];

co_await read_async(socket, s1_buffer.get(), sizeof(s1_buffer));

auto c1 = make_handshake_c1();
co_await send_async(socket, c1.get(), c1.size());

BYTE s2_buffer[HANDSHAKE_S2_SIZE];
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

The above code is a lot easier to understand, except that the `co_await` is completely new to us. We'll discuss this new keyword and how to interact with it in the next blog. 
