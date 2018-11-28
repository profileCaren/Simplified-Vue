## Introduction

Simplified-Vue try to implement a very simplified vue, with basic two-way binding.

## Features

- directives:
  - `v-model`
  - `v-bind:` and it's shorthand `:`

- template:  `{{ whatever }}` 
- computed

## How to run 

Open `index.html`.

## How to test if it work

Try typing codes below in the console and observe the changes in DOM:

```js
app.age = 10;

app.description = "A cute girl";

app.bestFriend.link = "https://www.baidu.com"

```

Try changing the value of `<input>` and log the `app.description`
```js
console.log(app.description);
```


## todos

- [x] 使用 Proxy 进行数据劫持
- [x] 编译模板
- [x] 发布-订阅模式实现数据到视图的绑定
- [x] computed
- [ ] watch