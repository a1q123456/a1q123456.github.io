---
title:  "Asynchronous Socket with C++ Coroutine TS"
subtitle: "Part 2 Implement your Coroutine."
date:   2018-08-19 00:00:00
---

# Promise and Future

Before we dive into the coroutine itself, we should get familiar with the `Promise` and the `Future`. Compared with callbacks, the `Promise` provides a **consistent** way to return a result or an error in a non-blocking function, and the `Future` provides a **consistent** way to retrieve them.

```c++

future<int> do_something_async(int a)
{
    std::shared_promise<int> p;

    // A non-blocking function using callback functions
    // This function is from a library, and the first parameter of the callback function is the result 
    // and the second one is the errorCode
    nonblocking_fetch_data_from_db([p, a](int result, int errorCode)
    {
        // This function is from another library, and the first parameter of the callback function is an 
        // errorCode but with a different type, and the second parameter is the file data
        nonblocking_read_file([p](error_code errorCode, const std::string& fileData)
        {
            p.set_result(std::stoi(fileData));
        });
    });

    return p.get_future();
}

auto future = do_something_async(1);

// With the `Future` class, we can always retrieve the result and the error code like the following.
// The first parameter is always the result, and the second one is always an errorCode.
// We can imagine our lives would be a bit easier if all non-blocking functions were to return `Futures`
// instead of using callback functions.
future.then([=](int result, const error_code ec) {
    if (ec) {
        // handle the error
        return;
    }

    // process the result
});

/////////////////////////////////////
```

# Coroutine

With the latest Coroutine TS, any function that contains `co_yield` and `co_await` and `co_reture` will be treated as a coroutine function. The stack (`Context`) of a coroutine function will be allocated on the heap with `operator new`.

Since you may have your own version of `Promise` and `Future`, we need to have a way to tell the C++ runtime about how to interact with a coroutine, and the way is to use `std::coroutine_traits<T>`.

A basic `std::coroutine_traits<T>` should be implemented like this:

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

            void set_exception(std::exception_ptr exc)
            {
                promise.SetException(std::move(exc));
            }
        };
    };
}
```

And the `Future` type should at least be implemented like this:
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
        // or if T is void
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

To interact with the C++ runtime, we define the following:
* `promise_type` to tell the C++ runtime about the type of the `Promise`;
* `promise_type::get_return_object()` to create the actual return value of a coroutine function;
* `promise_type::initial_suspend()` to tell the C++ runtime whether to execute the coroutine function immediately;
* `promise_type::final_suspend()` to tell the C++ runtime whether to destroy the `Context` immediately when the coroutine function has been executed;
* `promise_type::return_value()` and `promise_type::return_void()` to let the C++ runtime get the return value;
* `promise_type::set_exception()` to throw an exception;
* `Future::await_ready()` to tell the C++ runtime whether the result is immediately ready, which improves the performance if we don't need to wait;
* `Future::await_suspend()` to get a `coroutine_handle`, which can be used to resume from the suspension point (Where the `co_await` is executed);
* `Future::await_resume()` to give back the actual result to the C++ runtime.


With the above knowledge, we can now rewrite `do_something_async` with our `Coroutine` class:
```c++
Future<int> do_something_async(int a)
{
    using namespace std::chrono_literals;
    co_await sleep_async(10s)
    co_return a;
}
```

When the compiler compiles the code, it transfers the code to the code like the following:
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

Then, the `co_await`, the `co_return` and the `throw` statements in the above code get transferred further to:
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

# Coroutine Handle

A `Coroutine Handle` can be used to resume from where the `co_await` in the coroutine function gets executed or destroyed the `Context` of a coroutine function. It's created by the C++ runtime, and the definition looks like the following:
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

The C++ runtime uses:
* `address()` and `from_address()` to provide a way to convert a `coroutine_handle` to a pointer and to convert it back, which can be used with libraries written in C;
* `resume()` and `operator()()` to provide a way to resume to where the `co_await` gets executed;
* `operator bool()` to provide a way to tell whether the `coroutine_handle` is empty;
* `destroy` to provide a way to destroy itself manually;
* `done` to tell whether the coroutine function has been executed.

Developers don't need to call the `destroy()` to destroy the coroutine context if the `final_suspend` doesn't return `suspend_always`.

The final implementation of a coroutine can be found on [here](https://github.com/a1q123456/AsyncIocpSocket/blob/master/AsyncIocpSocket/Await.h).