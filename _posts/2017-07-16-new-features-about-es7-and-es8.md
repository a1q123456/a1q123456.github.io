---
title:  "ES7、ES8最新特性"
date:   2017-07-17 00:00:00
categories: How-To
comments: true
---

## Array.prototype.includes

以后，如果只想知道元素是否在数组当中，可以使用`arr.includes(...)`来取代旧的`arr.indexOf(...) !== -1`，
类似于Python中的`in`操作符.

`Array.prototype.indexOf` 返回元素在数组中的位置，若不存在，则返回`-1`。
相比而言，`Array.prototype.includes` 返回`boolean`类型，`true`表示该数组包含此元素，否则为`false`。


在以前，必须使用这样的语法：


```javascript
let arr = [1, 3, 5, 7, 9];
if (arr.indexOf(3) !== -1)
{
    // includes
}

// or

if (~arr.indexOf(3)) // where `~` is equivalents -(x + 1)
{
    // includes    
}
```

以后可以使用更简洁的新语法：

```javascript
let arr = [1, 3, 5, 7, 9];
if (arr.includes(3))
{
    console.log('includes');
}
```
---
## Object.values 以及 Object.entries

`Object.values`与以前的Object.keys类似，`Object.values` 返回对象的值的数组，`Object.keys`返回对象的键的数组。
`Object.entries`返回键值对的数组，形如`[[key1, value1], [key2, value2]]`

```javascript
let myObj = {a: 1, b: 2, c: 3};
let keys = Object.keys(myObj); // ['a', 'b', 'c']
let values = Object.values(myObj); // [1, 2, 3]
let key_value_pair = Object.entires(myObj); // [[a, 1], [b, 2], [c, 3]]
```
以后可以使用`Object.entires`更方便的将Object转换为Map

```javascript
let myObj = {a: 1, b: 2, c: 3};
let myMap = new Map(Object.entires(myObj));
```
还可以使用`for/of`遍历`Object.entires`返回的值

```javascript
for (let [key, value] of Object.entires(myObj))
{
    // xxx    
}
```
---

## 字符串padding
新增了`String.prototype.padStart`和`String.prototype.padEnd`两个函数，用来填充字符串到指定长度
```javascript
let str1 = "x".padStart(5);
let str2 = "xx".padStart(5);


// Result:
//     x
//    xx
//

let str3 = 'x'.padStart(5, 'y');
let str4 = 'x'.padStart(5, 'z');

// Result:
// yyyyx
// zzzzx
```

---
## 幂运算符`**`

以前，当需要进行幂运算的时候，可以使用`Math.pow`，现在有了更简洁的语法`**`运算符：

```javascript
let p = 3 ** 2;  // 9 
p **= 2; // 81
```

---
## 允许尾部最后一个`,`

在老的规范下，不允许出现这样的情况
```javascript
func(
    1,
    2,
    3,) // error in old spec
```
现在可以了

---
## Object.getOwnPropertyDescriptors

新的反射特性允许开发者一次性获取对象所有属性的descriptor信息

```javascript

let myObj = {a: 1, b: 2, c: 3, get d() {return 1}};

console.log(Object.getOwnPropertyDescriptors(myObj))

/*

Object
    a: Object
        configurable: true
        enumerable: true
        value: 1
        writable: true
    b: Object
        configurable: true
        enumerable: true
        value: 1
        writable: true
    c: Object
        configurable: true
        enumerable: true
        value: 1
        writable: true
    d: Object
        configurable: true
        enumerable: true
        value: 1
        writable: true
        get: function()
        set: undefined
 */
```

## 异步函数

`async`关键字终于加入标准，以后可以这样写异步代码，而不用写回调函数了
```javascript

async function getDataFromServer()
{
    let data = await ajax.get('/data');
    for (let i of data)
    {
        let p = document.createElement('p');
        p.textContent = i;
        document.appendChild(p);
    }
    data = await ajax.get('/another/data');
    for (let i of data)
    {
        let another_data = await ajax.get('/another/data/dependent_on_data');
        for (let i of another_data)
        {
            let p = document.createElement('p');
            p.textContent = i;
            document.appendChild(p);
        }
    }
    alert('all data received'); // yes
    
}
```
相对于以前
```javascript
function getDataFromServer()
{
    ajax.get('/data', function(data) {
        let p = document.createElement('p');
        p.textContent = i;
        document.appendChild(p);
        ajax.get('/another/data', function(data) {
            for (let i of data)
            {
                ajax.get('/another/data/dependent_on_data', function(another_data) {
                    let p = document.createElement('p');
                    p.textContent = another_data;
                    document.appendChild(p);
                });
            }
            alert('all data received'); // actually not
        });
    });
}
```
`async`关键字简化了异步回调的编写模式，可以使用同步的方式写异步代码，并且不容易出错
