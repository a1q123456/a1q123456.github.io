---
title:  "C++-基于coroutine的异步Socket 二、关于Socket的IOCP API"
date:   2018-08-26 00:00:00
---

Windows中很多与IO相关的API，都允许传入Overlapped参数，这些允许传入Overlapped参数的函数一般都支持IOCP。本文只介绍与Socket相关的API。

在介绍IOCP的异步函数之前，有必要先介绍一下Windows API中的几个线程池函数，这些函数对实现IOCP的回调很有帮助。

通过IOCP实现异步Socket的逻辑在于：首先，启动IO线程池，并绑定到Socket上，然后，启动异步IO操作，最后，当异步操作完成时，由IO线程池进行回调。因此，首先需要建立IO回调线程池。

# CreateThreadpoolIo

```c++

PTP_IO CreateThreadpoolIo(
  HANDLE                fl,
  PTP_WIN32_IO_CALLBACK pfnio,
  PVOID                 pv,
  PTP_CALLBACK_ENVIRON  pcbe
);

```

该函数的文档，可以在[这个页面上找到](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-createthreadpoolio)

用户通过调用这个函数来创建IO线程池。其中，`f1`参数就是IO对象（File Handle、 Socket等，这些对象对于内核来说没有区别），`pfnio`是回调函数，`pv`是可以用来传递某些用户数据，`pcbe`是线程池环境。

示例：
```c++

auto _io = CreateThreadpoolIo((HANDLE)socket, IoCallback, this, nullptr);

```
其中，IoCallback的Prototype为：
```c++
void WINAPI IoCallback(
	_Inout_     PTP_CALLBACK_INSTANCE Instance,
	_Inout_opt_ PVOID                 Context,
	_Inout_opt_ PVOID                 Overlapped,
	_In_        ULONG                 IoResult,
	_In_        ULONG_PTR             NumberOfBytesTransferred,
	_Inout_     PTP_IO                Io
)

```
关于该函数的详细文档，可以查阅[这个页面](https://msdn.microsoft.com/en-us/50515cec-8359-48a2-a85b-b4382c88107c)。

用户定义这样的函数，并作为pfnio参数传递给CreateThreadPoolIO，就可以注册为IO操作的回调函数。其中，Instance参数用来传递给其他IO函数；Context参数就是之前的pv参数；Overlapped就是进行IO操作时，传递的LPOVERLAPPED指针；IoResult是系统错误代码，0表示成功，其他的值表示失败的代码，可以通过查阅[这个页面](https://docs.microsoft.com/en-us/windows/desktop/Debug/system-error-codes)，或通过`FormatMessage`函数来获取详细信息。


# StartThreadpoolIo

[详细文档](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-startthreadpoolio)

```c++
void StartThreadpoolIo(
  PTP_IO pio
);
```

`pio`参数是之前通过CreateThreadPoolIO创建的IO线程池对象。用户必须在每次进行异步IO操作前调用这个函数。

# CloseThreadpoolIo

[详细文档](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-closethreadpoolio)

```c++
void CloseThreadpoolIo(
  PTP_IO pio
);
```

在使用完IO线程池以后，用户必须手动释放这个IO线程池。假如没有正在进行的回调函数，调用这个函数会立即释放线程池，否则，会当所有回调函数都执行完成后再异步地释放这个线程池。

# 常用的可以使用IOCP的Socket函数

* AcceptEx
* ConnectEx
* WSARecv
* WSASend

这些函数的详细文档可以在[Windows Sockets 2](https://docs.microsoft.com/en-us/windows/desktop/api/_winsock/)上找到。熟悉Socket Api的朋友一定不会对这些函数的参数感到陌生，本文只介绍这些函数特有的`lpOverlapped`参数。

`lpOverlapped`参数允许传入一个`OVERLAPPED`类型的结构体指针。用户可以通过这个参数，来传递某些用户数据（比如这个操作专有的回调函数、状态数据等）。一般来说，当用户需要传递用户数据时，不应该直接修改这个结构体的成员，而应该通过扩展结构体的成员来实现，如作为另一个类型的第一个成员，示例如下：

```c++
struct MyOverlapped 
{
    WSAOVERLAPPED overlapped;
    void* state;
};

```

在扩展成员的时候，必须要注意，新的类型也应该是pod类型。本人的AsyncIocpSocket项目中，使用lpOverlapped参数来传递Promise，然后通过Promise来给异步操作设置结果，并嗲用coroutine_handle来回调，以下代码截取自AsyncIocpSocket：

```c++
void WINAPI IoCallback(
	_Inout_     PTP_CALLBACK_INSTANCE Instance,
	_Inout_opt_ PVOID                 Context,
	_Inout_opt_ PVOID                 Overlapped,
	_In_        ULONG                 IoResult,
	_In_        ULONG_PTR             NumberOfBytesTransferred,
	_Inout_     PTP_IO                Io
)
{
	LPWSAOVERLAPPED wsaOverlapped = reinterpret_cast<LPWSAOVERLAPPED>(Overlapped);
	MyOverlapped* myOverlapped = reinterpret_cast<MyOverlapped*>(wsaOverlapped);
	AsyncIoState* state = reinterpret_cast<AsyncIoState*>(myOverlapped->state);
	if (IoResult != 0)
	{
		state->disconnectCallback();
		state->completionSource.SetException(std::make_exception_ptr<SocketError>(IoResult));
	}
	else if (NumberOfBytesTransferred == 0 && !state->isConnecting)
	{
		state->disconnectCallback();
		state->completionSource.SetException(std::make_exception_ptr<SocketError>(WSAECONNRESET));
	}
	else
	{
		state->completionSource.SetResult(NumberOfBytesTransferred);
	}
	
	delete state;
	delete myOverlapped;
}
```

其中，completionSource就是Promise对象。