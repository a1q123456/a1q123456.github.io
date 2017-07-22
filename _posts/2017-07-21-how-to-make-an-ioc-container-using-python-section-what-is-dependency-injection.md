---
title:  "Python-如何实现一个依赖注入IOC容器 一：什么是依赖注入"
date:   2017-07-21 00:00:00
categories: Python
comments: true
---

# 什么是依赖注入
> 在软件工程中，依赖注入是种实现控制反转用于解决依赖性设计模式。
  一个依赖关系指的是可被利用的一种对象（即服务提供端）。
  依赖注入是将所依赖的传递给将使用的从属对象（即客户端）。
  该服务是将会变成客户端的状态的一部分。
  传递服务给客户端，而非允许客户端来建立或寻找服务，是本设计模式的基本要求。
                                                                ——维基百科

想象一个类`UserRepository`，它的主要功能是：通过`ConfigurationManager`读取配置文件并处理配置信息，并结合调用参数，处理结果，并且将处理的结果通过一个`MySqlConnection`，向MySQL数据库中插入信息。
```python
class UserRepository:
    sqlConnection: MySqlConnection
    configurationManager: ConfigurationManager 
    
    def __init__(self):
        self.sqlConnection = MySqlConnection("localhost", 3306, "username", "password", "utf8")
        self.configurationManager = ConfigurationManager("/app.xml")
    
    
    # ...

```
现在，分析一下这个类的依赖：

![类依赖图](/images/make-an-ioc-container-step-by-step-1.png)

如图，这个类依赖于ConfigurationManager、MySqlConnection两个外部类，如果有上百个这样的类，有一天突然要求不使用MySqlConnection，而换成PostgreSqlConnection，想必改起来会累死的。

一个类应该只关心自己的内部逻辑，不应该关心怎么从外部获取数据或返回数据到外部。

现在将依赖结偶，抽象出专门的数据库操作接口 `ISqlConnection`，然后基于 `ISqlConnection`分别实现 `MySqlConnection`、`PostgreSqlConnection`。
再实现一个 `ISqlConnectionProvider`，以后每当需要数据库连接，都通过`ISqlConnectionProvider`获取数据库连接。
如果需要改变数据库连接逻辑，只需要改变 `ISqlConnectionProvider`的逻辑就可以了

```python
class UserRepository:
    sqlConnection: ISqlConnection
    configurationManager: IConfigurationManager 
    
    def __init__(self):
        self.sqlConnection = ISqlConnectionProvider.getConnection()
        self.configurationManager = IConfigurationManagerProvider.getConfigurationManager()
    
    
    # ...

```


# 什么是IOC Container

*IOC(Inverse of Control) Container*依赖倒转容器。经过结偶，`UserRepository`类已经很完美了，但是，如果能每次都自动获取依赖，而不需要手动调用Provider，岂不是更方便。


如果可以通过以下方式，将依赖作为参数，由类的使用者提供，那就更完美了。
```python
class UserRepository:
    sqlConnection: ISqlConnection
    configurationManager: IConfigurationManager 
    
    def __init__(self, sqlConnection: ISqlConnection, configurationManager: IConfigurationManager):
        self.sqlConnection = sqlConnection
        self.configurationManager = configurationManager
    
    # ...

```

Python 3.5中，已经加入了Type Hinting的支持，因此可以通过获取参数的Type Hinting，获取参数的期望类型。

如果每一次都由类的使用者提供的话，想必使用者就会产生对很多乱七八糟毫不相干的类的依赖。
因此，可以通过一个容器，专门管理这些依赖，然后在需要的时候提供给使用者，那就很方便了。

这样的，可以管理类的依赖关系的容器，就是IOC容器了。实现这样的容器，主要有以下几个步骤。

## 分析依赖

要让依赖可以被外部分析到，最好的办法自然是把所依赖的类作为构造函数的参数。这样外部就可以通过反射等方式，获取参数类型，根据类型，传递所需要的依赖对象。

因此，常见的分析依赖的方法，就是*通过反射，将类所依赖的对象的类型读取出来，然后根据依赖对象的类型，给出相应的依赖对象*。当然，这需要语言特性的支持。

## 依赖注入

把构造函数的所有的参数都准备好后，把参数全部传递给构造函数，自然就可以完成类的构造。
当使用者需要一个类的时候，只需使用容器来构造类即可。这个过程称为 *依赖注入*。
```python
userRepository: UserRepository = UserRepository(ISqlConnectionProvider(), IConfigurationManagerProvider())

// vs

userRepository: UserRepository = container.make(UserRepository)

```

