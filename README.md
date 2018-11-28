## Introduction

Simplified-Vue try to implement a very simplified vue, with basic two-way binding.

## How to run 

Open `index.html`.

## how to test

Try typing below in the console and observe the changes in view:

```js
myVue.age = 10;

myVue.description = "A cute girl";

myVue.bestFriend.link = "https://www.baidu.com"

```

Try changing the value of `<input>` and log the `myVue.description`
```js
console.log(myVue.description);
```


## todos

- [x] 使用 Proxy 进行数据劫持
- [x] 编译模板
- [x] 发布-订阅模式实现数据到视图的绑定
- [ ] computed
- [ ] watch