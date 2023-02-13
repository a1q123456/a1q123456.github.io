---
title:  "Making an IOC container in Python"
subtitle: "Part 3 The Service Container"
date:   2017-10-11 00:00:00
---

# Service Container

A service container may be used to store all the services the program needs and provide a way to register each service and how to create them. This article shows a simplest service container and a simplest injector look like.

A simplest service container may look like the following:
```python
class ServiceContainer(IServiceContainer):
    def __init__(self):
        self._type_container = []

    def register_service(self, service: Type):
       self._type_container.append(service)

    def create_service(self, t: Type):
        Service = next(ServiceType for ServiceType in self._type_container if ServiceType == t)
        return Service()
```

The above code uses a list to store all the services, and when the `create_service` method gets called, it takes the service from the list and creates the service.

# Injector

As we mentioned before, an injector may be used to resolve the dependency a class needs and create an instance of the class.

The simplest implementation of an injector may look like the following:
```python
class Injector:
    def __init__(self, container: IServiceContainer):
        self._container = container

    def inject(self, T: Type):
        parameters = inspect.signature(t.__init__).parameters
        # Create each service the type needs
        dependencies = [self._container.create_service(parameter.annotation) for parameter in parameters.values()]
        return T(args=dependencies)
```
The above code uses the inspect module to retrieve the type hinting of each parameter a type declares, and calls IServiceContainer.create_service to create each of them.

# Further Improvements for The Service Container

The next article will discuss how a service container provides a way to customise the creation of each service.
