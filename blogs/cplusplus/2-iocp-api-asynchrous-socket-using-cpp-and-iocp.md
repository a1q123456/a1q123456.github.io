---
title:  "Asynchronous Socket with C++ Coroutine TS"
subtitle: "Win32 IOCP API"
date:   2018-08-26 00:00:00
---

Almost every IO-related API in Windows allows an `Overlapped` parameter, allowing developers to call the APIs asynchronously.

Before discussing the IOCP APIs, it is necessary to introduce APIs for creating and interacting with thread pools. Those functions will help developers to use the callback mechanism of IOCP APIs.

An ordinary practice of using IOCP for asynchronous IO is as follows:
1. Start an IO thread pool, and bind it to a socket;
2. Start an asynchronous IO operation;
3. When the operation is done, windows will call the callback function on the IO thread pool.

The `CreateThreadpoolIo` API is used to start an IO thread pool.

# CreateThreadpoolIo

```c++

PTP_IO CreateThreadpoolIo(
  HANDLE                fl,
  PTP_WIN32_IO_CALLBACK pfnio,
  PVOID                 pv,
  PTP_CALLBACK_ENVIRON  pcbe
);

```

The documentation of this API can be found on [here](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-createthreadpoolio).

Developers use this API to create an IO thread pool which is designed for handling IO operations. The first parameter `fl` is a file handle. e.g. File Handles, Sockets or etc. The second parameter `pfnio` is a callback function for handling IO completion events. The third parameter `pv` is designed for passing the user data. And the last one `pcbe` is the thread pool environment.

E.g.
```c++

auto _io = CreateThreadpoolIo((HANDLE)socket, IoCallback, this, nullptr);

```
The signature of the `IoCallback` function is defined as the following:
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
Where the `Instance` parameter can be passed to some other APIs, and developers must not modify it; The `Context` parameter is the user data; The `Overlapped` parameter is the  `Overlapped` parameter passed to an asynchronous IO API which will be discussed later; The `IoResult` parameter is an error code, which is detailed [here](https://docs.microsoft.com/en-us/windows/desktop/Debug/system-error-codes).

The documentation of this callback function can be found on [here](https://msdn.microsoft.com/en-us/50515cec-8359-48a2-a85b-b4382c88107c).

# StartThreadpoolIo


```c++
void StartThreadpoolIo(
  PTP_IO pio
);
```

Developers may use `StartThreadpoolIo` to start an IO thread pool. The `pio` is the thread pool object.

The documentation of this API can be found on [here](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-startthreadpoolio)

# CloseThreadpoolIo


```c++
void CloseThreadpoolIo(
  PTP_IO pio
);
```

Developers may manually destroy the thread pool after they have used it. However, it will automatically be destroyed once there are no outstanding callbacks.

The documentation of this API can be found on [here](https://docs.microsoft.com/en-us/windows/desktop/api/threadpoolapiset/nf-threadpoolapiset-closethreadpoolio)

# Commonly Used Socket APIs That Supports IOCP

* AcceptEx
* ConnectEx
* WSARecv
* WSASend

The above functions accept an `Overlapped` parameter and are from **Windows Sockets 2**, which is documented [here](https://docs.microsoft.com/en-us/windows/desktop/api/_winsock/). 

Developers may add new fields to this structure to pass some user data, and developers must not change the original object directly. Developers should inherit the `OVERLAPPED` `struct` in C++ code or create a new `struct` and put a `OVERLAPPED` field in the first place of the `strcut` in C code.
```c++
struct MyOverlapped 
{
    OVERLAPPED overlapped;
    void* state;
};
```
The [AsyncIocpSocket](https://github.com/a1q123456/AsyncIocpSocket) project uses the `lpOverlapped` parameter to pass a `Promise` pointer. It then uses the `Promise` object to set the result for an asynchronous operation and then calls `coroutine_handle` to resume the execution of a coroutine. For example, the following code is from the project.

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
Where the `completionSource` is the `Promise` object.
