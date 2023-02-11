---
title:  "Code management issues in big projects"
date:   2023-02-11 00:00:00
---

In my experience, code refactoring has been an anguish in big projects. It may be repetitive and tedious and take a long time to finish. But the result might also be disappointing, as it does not directly create value, and the refactoring may cause some issues. But, with projects getting bigger and bigger, refactoring is always needed. 

In this article, I will discuss the code mangement issues in big projects. I will also introduce a few tools and concepts regarding code management.

# Code analysation

I have worked on a project with more than 300,000 lines of C++ code that had some code management issues. For example, some old code in the project still used the singleton pattern. However, we have replaced the old singleton pattern with a new factory, and the factory should create all the service classes to make the code easier to split and reuse. One day, the project leader suddenly decided to refactor the code base. Since the code base was too huge, four people were working on the refactoring at the same time. But the refactoring still took weeks to finish. The project had some code like this:

```c++
std::string filePath = ProjectService::GetInstance().DownloadProjectFile(projectID);
ViewerService::GetInstance().OpenFile(filePath);
```

If the code base is small, it is unnecessary to refactor this piece of code. However, when the code base has grown to 300,000 lines with hundreds of services, it makes sense to split some services into their library files. However, with the singleton pattern, it's impossible to separate the code as the `GetInstance` method is one of the member functions of a service and must exist in the main executable file.

Now, here is a question. How are we supposed to refactor code like this if we have tons of code? 

In my opinion, repetitive and boring jobs should always be handled by machines to ensure humans can make no mistakes. Clang may be used in this case to solve similar issues.

Clang is not just a compiler but also a library providing APIs for generating [ASTs](https://en.wikipedia.org/wiki/Abstract_syntax_tree). ASTs offer a way to interact with the code with meaningful details. For example, the above code may be translated into a tree like the following:
```
| `-CompoundStmt 0x11902e0 <line:20:1, line:24:1>
|   |-DeclStmt 0x1190158 <line:21:5, col:88>
|   | `-VarDecl 0x118fef0 <col:5, col:87> col:17 used filePath 'std::string':'std::__cxx11::basic_string<char>' cinit destroyed
|   |   `-ExprWithCleanups 0x1190140 <col:28, col:87> 'std::string':'std::__cxx11::basic_string<char>'
|   |     `-CXXConstructExpr 0x1190110 <col:28, col:87> 'std::string':'std::__cxx11::basic_string<char>' 'void (std::__cxx11::basic_string<char> &&) noexcept' elidable
|   |       `-MaterializeTemporaryExpr 0x11900f8 <col:28, col:87> 'std::string':'std::__cxx11::basic_string<char>' xvalue
|   |         `-CXXBindTemporaryExpr 0x11900d8 <col:28, col:87> 'std::string':'std::__cxx11::basic_string<char>' (CXXTemporary 0x11900d8)
|   |           `-CXXMemberCallExpr 0x1190090 <col:28, col:87> 'std::string':'std::__cxx11::basic_string<char>'
|   |             |-MemberExpr 0x1190040 <col:28, col:58> '<bound member function type>' .DownloadProjectFile 0x118f768
|   |             | `-CallExpr 0x1190020 <col:28, col:56> 'ProjectService' lvalue
|   |             |   `-ImplicitCastExpr 0x1190008 <col:28, col:44> 'ProjectService &(*)()' <FunctionToPointerDecay>
|   |             |     `-DeclRefExpr 0x118ffa8 <col:28, col:44> 'ProjectService &()' lvalue CXXMethod 0x118f578 'GetInstance' 'ProjectService &()'
|   |             `-ImplicitCastExpr 0x11900b8 <col:78> 'int' <LValueToRValue>
|   |               `-DeclRefExpr 0x1190070 <col:78> 'int' lvalue ParmVar 0x118fd70 'projectID' 'int'
|   `-CXXMemberCallExpr 0x11902a0 <line:23:5, col:51> 'void'
|     |-MemberExpr 0x1190250 <col:5, col:34> '<bound member function type>' .OpenFile 0x118fc98
|     | `-CallExpr 0x1190230 <col:5, col:32> 'ViewerService' lvalue
|     |   `-ImplicitCastExpr 0x1190218 <col:5, col:20> 'ViewerService &(*)()' <FunctionToPointerDecay>
|     |     `-DeclRefExpr 0x11901c0 <col:5, col:20> 'ViewerService &()' lvalue CXXMethod 0x118faa8 'GetInstance' 'ViewerService &()'
|     `-ImplicitCastExpr 0x11902c8 <col:43> 'const std::string':'const std::__cxx11::basic_string<char>' lvalue <NoOp>
|       `-DeclRefExpr 0x1190280 <col:43> 'std::string':'std::__cxx11::basic_string<char>' lvalue Var 0x118fef0 'filePath' 'std::string':'std::__cxx11::basic_string<char>'

```

With a tree like the above, it's possible to create a program or a script to find calls to a static member function `GetInstance` and transform the call to another factory. Luckily, everything we may need can be found in the [documentation](https://clang.llvm.org/doxygen/group__CINDEX.html). In addition, clang also provides a [python binding](https://libclang.readthedocs.io/en/latest/index.html) which I recommend more as doing this kind of work in python may reduce developers' effort and save time.

# Code generation

Another big project I have worked on is an online game backend. It stores players' state data in the database. However, how they kept the game state is quite old-fashioned. They used to dump the memory of a struct and use base64 to convert the piece of memory to a string and then store the string in the database. 

It is not only unsafe but also undefined behaviour. It just works -- unless someone edits the database manually, which may break the whole system. One day, they decided to use JSON to store those game states. However, manually doing it is such a pain as there were about 250 structs. Of course, my approach was to use clang to generate serializers and deserializer, and I finished it in 3 days. What happened was they had code like this:
```c++
struct ItemPurchaseState
{
    int itemID;
    int price;
    const char itemName[0];
};
```

With Clang, I was able to extract each field and its type. But code generation was a problem to solve. I didn't create a string containing the serializer. Instead, I used another library [Jinja](https://jinja.palletsprojects.com/en/3.1.x/), a template engine that has been used widely in HTTP frameworks like Tornado. With Jinja, I was able to create a serializer template like the following:
```c++
class ItemPurchaseStateSerialiser
{
    rapidjson::Value Serialise(const ItemPurchaseState& state)
    {
        rapidjson::Value result;
        result.SetObject();

        {% for field in fields %}
        result["{{field.name}}"] = state.{{field.name}};
        {% endfor %}

        return result;
    }
};
```
Templates made the work much easier as I didn't have to maintain a huge string containing C++ code and deal with escaping issues. 

# Code linter

There are some issues worth checking before the code review, for example, variables being used before getting initialised or code style requirements. However, developers may not be able to find out those tiny issues. ESLint is a powerful tool for linting Javascript and Typescript code. Luckily, C++ has a similar tool, [clang-tidy](https://clang.llvm.org/extra/clang-tidy/).

My suggestion is to create a git hook and run clang-tidy with a project-specific config file and only allow push if the code meets all the requirements.

# GSL

[GSL](https://github.com/microsoft/GSL) is another powerful tool providing a set of classes that only exist in the debug mode. It made code analysation a lot easier. For example:

```c++

Node* create_node();

void process_node(Node* node);
```

The first function, `create_node`, creates a `Node` object; The second function, `process_node`, takes a `Node` pointer and does not return. It is not clear whether or not developers should destroy the `Node` object after calling `process_node` or `process_node` will take ownership of `node`, and developers have to check the documentation for this piece of information. 

With the `owner` class, we can rewrite the above code to the following:
```c++
gsl::owner<Node*> create_node();

void process_node(gsl::owner<Node*> node);
```

Since the `owner` class marks the ownership of a pointer, it is clear that `process_node` takes ownership and does not require developers to destroy this object after calling this function. 