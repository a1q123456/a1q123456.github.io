---
title:  "Python-如何实现一个依赖注入IOC容器 四：最简单的服务容器"
date:   2017-10-11 00:00:00
---

# Service Container

现在，我们已经可以获取服务的依赖关系，但仍然需要一个容器来储存被依赖的服务，然后在需要的时候提供这个服务的实例，这个容器被称为`Service Container`。

最基本的容器只需要用一个`list<type>`就可以实现，由外部提供类型，并注册到`Service Container`中。以后当类依赖一个服务的时候，就可以直接从Service Container中拿出这个服务的实例。

要完成上述操作，必须有一个专门的`Injector`，用来分析类的依赖，然后从`Service Container`中获取相应的实例，最后提供给构造函数。很显然，`Injector`必须与`Service Container`相耦合，因此为了方便注入，`Service Container`应该提供一个`make_injector`方法，为外部提供`Injector`，以及`get_service`方法，为外部提供相应类型的实例。

```python
from itertools import filter

class ServiceContainer(IServiceContainer):
    _type_container = list()

    def register_service(service: Type):
       self._type_container.append(service)

    def make_injector():
       return Injector(self)

    def get_service(t: Type):
        # pretend resolving service
        t_in_container = filter(lambda x: x == t, self._type_container).next()
        return t_in_container()

services = ServiceContainer()
services.register_service(int)
injector = services.make_injector()
injector.inject(...)

```

# Injector

有了容器，注入器就可以直接从容器中找到服务，由注入器提供这个服务的实例，并注入到构造函数中。`Injector`类提供`inject`方法，在`inject`方法中，通过`inspect`库获得构造函数依赖，然后提供依赖的实例给构造函数，最后创建出类实例。

```python

from functools import partial

class Injector:
    def __init__(container: IServiceContainer):
        self._container = container
    
    def inject(t: Type):
        parameters = inspect.signature(t).parameters
        constructor = t
        for name, parameter in parameters.items():
            TParameter = parameter.annotation
            obj_parameter = self._container.get_service(TParameter)
            constructor = partial(constructor, obj_parameter) # using partial() to binding parameter
        return constructor()

```

# 进一步优化Container

上例中，`Container`只储存了类型，并没有储存如何实例化类型，我们将在下一节继续研究。