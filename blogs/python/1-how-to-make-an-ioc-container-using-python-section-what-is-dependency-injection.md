---
title:  "Making an IOC container in Python"
subtitle: "Part 1 Dependency Injection"
date:   2017-07-21 00:00:00
---

# Class decoupling

Imagine there is a class `UserRepository` which reads configuration using `ConfigurationManager`, processes user-related actions, and stores user data in the database using `MySqlConnection`.
```python
class UserRepository:
    sqlConnection: MySqlConnection
    configurationManager: ConfigurationManager 
    
    def __init__(self):
        self.sqlConnection = MySqlConnection("localhost", 3306, "username", "password", "utf8")
        self.configurationManager = ConfigurationManager("/app.xml")
    # ...
```
This class depends on `ConfigurationManager` and `MySqlConnection`, which implement services instead of interfaces. Therefore, if we were to switch the database from Mysql to SqlServer, it would cost developers a lot of effort to change the dependency. Also, a class should only care about how its implementation instead of the implementation of other services.

To decouple the above classes, we should make an `ISqlConnection` interface for `MySqlConnection` and an `IConfigurationManager` interface for `ConfigurationManager` and let both types inherit from the interfaces. Then, we can refactor `UserRepository` to the following:
```python
class UserRepository:
    sqlConnection: ISqlConnection
    configurationManager: IConfigurationManager 
    
    def __init__(self):
        self.sqlConnection = ServiceFactory.createService(ISqlConnection)
        self.configurationManager = ServiceFactory.createService(IConfigurationManager)
    # ...
```

# Introducing to Dependecny Injection

The above code uses the factory pattern to manage service implementations. It decouples the dependence. However, `UserRepository` must depend on the factory class for getting services. In other words. it creates another dependency.

With dependency injection, `UserRepository` does not need to create services. Instead, it declares dependency using the Type Hinting feature introduced in Python 3.5, and the injector will create services the class needs for it when we need to use the class.
```python
class UserRepository:
    sqlConnection: ISqlConnection
    configurationManager: IConfigurationManager 
    
    def __init__(self, sqlConnection: ISqlConnection, configurationManager: IConfigurationManager):
        self.sqlConnection = sqlConnection
        self.configurationManager = configurationManager
    # ...
```
