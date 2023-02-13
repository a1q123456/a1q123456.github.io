---
title:  "Making an IOC container in Python"
subtitle: "Part 2 Resolving Dependency"
date:   2017-07-22 00:00:00
---

The most essential part for resolving the dependency is retrieving the dependency declared by the `__init__`. To achieve this, we may use the inspect module. This article will share how I managed to do this with this module in my past projects.

The inspection module's documentation can be found on [this page](https://docs.python.org/3/library/inspect.html).

# Retrieving the types of parameters

We may use the `signature` function to retrieve parameters and their types.

```python
def test(a: int): 
    ...

inspect.signature(test) # <Signature (a: int)>

parameters = signature.parameters  # mappingproxy(OrderedDict([('a', <Parameter "a: int">)]))
```

The `signature` function returns a `Signature` object, from which we can access the parameter declaraction including the type hinting of each parameter by accessing it's `parameters` property.

How we may do it looks like the following

```python
class Test:
    def __init__(self, a: IConfiguration):
        ...

parameters = inspect.signature(Test.__init__).parameters

for name, parameter in parameters.items():
    TypeOfParameter = parameter.annotation  # The dependency `IConfiguration`
```
