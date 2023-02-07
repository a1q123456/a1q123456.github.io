---
title:  "Python-如何实现一个依赖注入IOC容器 五：控制服务的生命周期"
date:   2018-08-15 00:00:00
---

# 服务的生命周期

服务的生命周期可以分为长期的、短期的、或其他特殊生命周期。服务的生命周期的划分应该由软件的设计者自己决定。一个HTTP框架中，一般会有
* 永久有效的服务（文件系统访问服务、配置管理服务）
* 用完即结束的服务（Model服务、搜索服务）
* 在一个请求内有效的服务（获取表单参数的Request服务）

# 生命周期的控制

最简单的办法市通过`Service Container`控制，为每个`Service`配置一种生命周期，然后当这种生命周期类型需要结束的时候，触发生命周期结束的事件，由`Service Container`捕获事件并且结束相应生命周期类型的`Service`。伪代码如下：

```python

class ServiceContainer:
    services: dict[ELifeTime, list[any]]

    def end_life_time(lifetime: ELifeTime):
        services.pop(lifetime)


# when http session ended
service_container.end_life_time(ELifeTime.HttpSessionScope)

```

# 总结

本系列介绍了利用Python实现依赖注入框架的基本原理（Type Hinting），以及依赖注入框架常用的的功能。