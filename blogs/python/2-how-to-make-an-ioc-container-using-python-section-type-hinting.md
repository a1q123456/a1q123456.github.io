---
title:  "Type Hinting in Python"
date:   2017-07-22 00:00:00
---

In Python, the types of variables may change during the execution of the program. It makes the code more flexable but it also confuses developers and the IDE sometimes, as both of them may need to analyse the code to find out the types of variables.

To solve this issue, Python introduced the Type Hinting feature. It allows developers declare the types of variables like what developers do in static-typed languages. For example:
```python
def add(a: int, b: int):
    return a + b
```

When calling the above function with some other types of parameters, IDE will be able to tell the developers it is not what the function expects. For example:
```python
sum('a', 'bcd')  # Developers will be warned
```

It also helps IDEs to provide suggestions. For example:
```python

l = ['a', 'b', 'c', 'd']


def foo(arr):
    for i in arr:
        i.  # type of i is unknown, the IDE is not able to provide any suggestions

# VS

def bar(arr: list[str]):
    for i in arr:
        i.  # i may be a string, the IDE is able to provide suggestions
```

Type Hinting is documented on [this page](https://docs.python.org/3/library/typing.html).
