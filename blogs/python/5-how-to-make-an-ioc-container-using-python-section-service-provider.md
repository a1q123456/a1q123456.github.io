---
title:  "Making an IOC container in Python"
subtitle: "Part 4 Service Providers"
date:   2017-10-11 00:00:00
---

With the simplest service container we created in the previous article, now we can look at making the service container provide a way to customise service creation. To achieve this, service providers may be used.

Imagine how a `MySqlDBConnection` service would look like:
```python
class MySqlConnection:
    def __init__(self, host, port, database):
        ...
```
We do not want the `MySqlConnection` service to read the configuration by itself, as this part of code is not relating to what this service should provide.

Typically, we will need to read the host address, the port number, and the database from a configration file to instantiate the above service. We may introduce a service provider class to achieve this.

# Service Provider

A provider class for the `MySqlDBConnection` service should be:
```python
class MySqlConnectionProvider(IServiceProvider):
    def __init__(self, configuration: IConfiguration):
        self._configuration = configuration

    def provide(self):
        return MySqlConnection(
            self._configuration["db_host"], 
            self._configuration["db_port"], 
            self._configuration["db_name"])
```

The above provider class takes an `IConfiguration` instance to retrieve the configration, and then use them to create a `MySqlConnection` instance.

With service providers, we can then modify the service container to allow developers to pass a provider class for creating a service.
```python
class ServiceContainer(IServiceContainer):
    _type_container: dict[Type, Type[IServiceProvider]]

    def __init__(self):
        self._type_container = {}

    def register_service(self, service: Type, provider: IServiceProvider):
       self._type_container[service] = provider

    def create_service(self, t: Type, injector):
        Tprovider = self._type_container[t]
        provider = injector.inject(Tprovider)
        return provider.provide()
```
