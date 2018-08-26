---
title:  "C++-基于coroutine的异步Socket 二、实现Coroutine"
date:   2018-08-19 00:00:00
categories: C++
comments: true
---

# Promise/Future

为了给异步函数提供更加统一规范的回调方式，通常使用Promise/Future来让异步函数通知调用方是否有结果或异常。Promise作为异步函数给调用方的通信端口，拥有设置结果、设置异常的功能；Future作为调用方获取异步结果的端口，拥有获取结果、获取异常的功能。

```c++

future<int> do_something_async(int a)
{
    promise<int> p;

    queue_user_work_item([p = std::move(p), a]
    {
        using namespace std::chrono_literals;
        sleep(10s);
        p.set_result(a);
    });
    return p.get_future();
}

auto f = do_something_async(1);

/////////////////////////////////////

// wait result
while (!f.ready())
    ;
if (f.has_result())
{
    print(f.result());
}
// has exception
else
{
    try
    {
        f.rethrow();
    }
    catch(const exception& e)
    {
        std::cout << e.what() << std::endl;
    }
}

// or

// use callback
f.then([=]{
    print(f.result());
}).catch([=] (exception_ptr ep)
{
    try
    {
        rethrow(ep);
    }
    catch(const exception& e)
    {
        std::cout << e.what() << std::endl;
    }
});
/////////////////////////////////////
```

# Coroutine Traits

在C++中，一个带有`co_yield`、`co_await`、`co_reture`语句的函数，会被编译器识别为Coroutine。

因此，runtime必须要知道
* 什么时候需要从当前`Context`中切换出来
* 什么时候返回
* 如何获取返回值

这意味着程序必须提供一个桥梁，与runtime进行交互，而这个桥梁就是`coroutine_traits`。用户实现`coroutine_traits`的特化，让`Promise`与runtime适配。

一个完整的`coroutine_traits`至少应该这样实现：

```c++

namespace std
{
    template <typename T>
    struct coroutine_traits<Future<T>>
    {
        struct promise_type
        {
            Promise<T> promise;

            Future<T> get_return_object()
            {
                return (promise.GetFuture());
            }

            bool initial_suspend() const noexcept
            {
                return false;
            }

            bool final_suspend() const noexcept
            {
                return false;
            }
            ////////////////////
            template <typename U>
            void return_value(U&& value)
            {
                promise.SetResult(std::forward<U>(value));
            }
            // when std::is_smae_v<T, void>
            void return_void()
            {
                promise.SetResult();
            }
            ///////////////////

            void set_exception(std::exception_ptr _Exc)
            {
                promise.SetException(_STD move(_Exc));
            }
        };
    };
}
```

其中`Future`类型至少需要这样实现：
```c++

template <typename T>
struct Future
{
    PromiseState _state;
    coroutine_handle<> _coroutine = nullptr;

    bool await_ready()
    {
        return _state->is_ready();
    }

    void await_suspend(coroutine_handle<> coroutine)
    {
        _state->AddDoneCallback([=]()
        {
            coroutine.resume();
        })
    }

    T await_resume()
    {
        return std::move(_state->result);
        // or
        return;
    }

    ~Future()
    {
        if (_coroutine)
        {
            // close coroutine, cleanup context
            _coroutine.destroy();
        }
    }
}

```


编译器需要：

* 用`coroutine_traits<Future<T>>::promise_type`来获取`Promise`的类型
* 用`coroutine_traits<Future<T>>::promise_type::get_return_object()`来构造返回值
* 用`coroutine_traits<Future<T>>::promise_type::initial_suspend()`来判断是否需要在开始调用函数时立即执行函数
* 用`coroutine_traits<Future<T>>::promise_type::final_suspend()`来判断是否需要在函数返回时立即清理`Context`
* 通过判断用户实现的是`coroutine_traits<Future<T>>::promise_type::return_value()`还是`coroutine_traits<Future<T>>::promise_type::return_void()`来判断返回值是否为`void`
* 用`coroutine_traits<Future<T>>::promise_type::return_value()`或`coroutine_traits<Future<T>>::promise_type::return_void()`来替换co_return语句，让Coroutine返回结果
* 用`coroutine_traits<Future<T>>::promise_type::set_exception()`来给Coroutine设置异常
* 用`Future::await_ready()`来判断是否需要切换`Context`
* 用`Future::await_suspend()`来提供给用户返回当前`Context`的Handler `coroutine_handle`
* 用`Future::await_resume()`来获取返回值


现在，可以用`Coroutine`来改写异步函数`do_something_async`

```c++
Future<int> do_something_async(int a)
{
    using namespace std::chrono_literals;
    co_await sleep_async(10s)
    co_return a;
}
```
编译器在编译这段代码时，会通过类似与如下的转换，来实现`Coroutine`

```c++
Future<int> do_something_async(int a)
{
    // compiler inserted
    auto  _context = new _do_something_async_context{a};
    auto _return_value = _context->promise.get_return_object();
    co_await _context->promise.initial_suspend();


    using namespace std::chrono_literals;
    co_await sleep_async(10s)
    co_return a;


    // compiler inserted
__exit:
    co_await _context->promise.final_suspend();
    delete _context;
}
```

其中`co_await`、`co_return`和`throw`会进一步转换为：
```c++
Future<int> do_something_async(int a)
{
    // compiler inserted
    auto  _context = new _do_something_async_context{a};
    auto _return_value = _context->promise.get_return_object();
    co_await _context->promise.initial_suspend();

    using namespace std::chrono_literals;

    // co_await sleep_async(10s)
    auto&& _a = sleep_async(10s);
    if (!_a.await_ready())
    {
        _a.await_suspend(<coroutine-handle>);
        // <switch context>
    }
    auto result = _a.await_resume();

    // co_return a;
    _context->promise.return_value(_context->params->a);

    // throw runtime_error("error")
    _context->promise.set_exception(make_exception_ptr<runtime_error>("error"));

__exit:
    co_await _context->promise.final_suspend();
    delete _context;
}
```


# Dynamically Allocated Context

考虑一下上一节的例子：


```c++

void s1_callback(error_code ec);
void c1_callback(error_code ec);
void s2_callback(error_code ec);
void c2_callback(error_code ec);

// Dynamically Allocated
auto s1_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S1_SIZE]);
auto self = shared_from_this();

read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
    self->s1_callback();
}});

void s1_callback(error_code ec)
{
    // do something

    // Dynamically Allocated
    auto c1 = make_handshake_c1();
    send_async(socket, c1.get(), c1.size(), [=](){
        self->c1_callback();
    }});
}

void c1_callback(error_code ec)
{
    // do something

    // Dynamically Allocated
    auto s2_buffer = std::shared_ptr<BYTE[]>(new BYTE[HANDSHAKE_S2_SIZE]);
    read_async(socket, s1_buffer.get(), s1_buffer.size(), [=](){
        self->s2_callback();
    }});
}

void s2_callback(error_code ec)
{
    // do something

    // Dynamically Allocated
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

在使用异步函数的时候，所有的`Context Variable`（参数、返回值、要发送的buffer、`this`等），都必须动态分配，否则当异步函数返回的时候，`Context Variable`将会被销毁，异步函数的执行就会出错。因此，C++的Croutine实质上使用了`operator new`分配了Coroutine函数的`Context`。


# Coroutine Handle

`Coroutine Handle`可以用来手动销毁一个Coroutine，或返回Coroutine的`Context`，Coroutine Handle由C++ Runtime构造。Coroutine Handle是这样定义的：

```c++
template <typename T>
struct coroutine_handle<T>
{
    coroutine_handle();
    coroutine_handle(nullptr_t);
    coroutine_handle &operator=(nullptr_t);
    static coroutine_handle from_address(void *);
    void *address();
    void operator()();
    explicit operator bool();
    void resume();
    void destroy();
    bool done();
};
```

其中
* `address()`、`from_address()`函数用来将`coroutine_handle`转换为`void*`和从`void*`转换回`coroutine_handle`，主要用来跟C库进行交互
* `resume()`与`operator()()`用来切换回`Coroutine`的`Context`
* `operator bool()`用来判断当前`coroutine_handle`是否为空
* `destroy`用来手动销毁Coroutine的`Context`
* `done`用来判断当前`Coroutine`是否已经执行完成。

多半情况下，用户不需要手动调用`destroy`方法，但是假如用户需要手动销毁`Coroutine`(通常为`final_suspend`为`true`或`suspend_always`的时候)，就需要调用`destroy`方法来销毁`Context`。

最终的Coroutine实现，可以参考笔者的[代码](https://github.com/a1q123456/AsyncIocpSocket/blob/master/AsyncIocpSocket/Await.h)