---
title:  "Python-如何实现一个依赖注入IOC容器 四：Service Provider"
date:   2017-10-11 00:00:00
categories: Python
comments: true
---

如图，ElasticSearchService类主要用来提供邮件发送服务，这个类有如下几个依赖：

1. string类型的默认索引
2. Uri类型的ElasticSearch节点地址
3. DbContext类型的数据库上下文类

其中，默认索引和节点地址是从配置文件中获取的，数据库上下文类是由`Service Container`提供的。

面对上述复杂的依赖，我们必须通过一个类型生成器来专门指导`Service Container`如何生成实例，这样的生成器就被成为`Service Provider`。

# Service Provider

为了不影响服务的核心逻辑，外部参数不应该由服务自己获得，而应该通过参数由`Service Provider`提供。

```python

class ElasticSearchServiceProvider(IServiceProvider):
    def __init__(db_context: DbContext, configuration: IConfiguration):
        self.db_context = db_context
        self.configuration = configuration

    def provide():
        default_index = configuration["elasticsearch_index"]
        node_uri = configuration["elasticsearch_uri"]
        return ElasticSearchService(default_index, node_uri, self.db_context)

```

上述代码中，`ElasticSearchServiceProvider`是一个`Service Provider`，他通过构造函数让`Container`提供了`DbContext`实例，又通过配置文件获取了默认索引和节点地址，生成了`ElasticSearchService`类型实例。

接下来，开始修改`Service Container`，以便让`Service Container`可以通过`Service Provider`提供实例。


```python
class ServiceContainer(IServiceContainer):
    _type_container: Dict[Type, Type[IServiceProvider]] = dict() # change list to dict

    def register_service(service: Type, provider: IServiceProvider):   # new parameter: provider
       self._type_container.append(service)

    def make_injector():
       return Injector(self)

    def get_service(t: Type):
        Tprovider = self._type_container[t]                 #using indexer to get provider type
        provider = self.make_injector.inject(Tprovider)     #inject provider type to get provider instance
        return provider.provide()                           #using provide() method to get type instance
```

# 进一步优化Container

现在，`Service Container`已经可以提供需要的类型了。但是功能还不够完善，比如我们无法直接注册一个单例模式的服务，下一章将继续研究这个课题。