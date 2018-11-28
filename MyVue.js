class Publisher {
  constructor() {
    // { key: [callbacks] }
    this.subscribersMap = {};
  }
  addSub(key, subscriber) {
    if (!this.subscribersMap[key]) {
      this.subscribersMap[key] = [];
    }
    this.subscribersMap[key].push(subscriber);
  }
  notify(key) {
    if (!this.subscribersMap[key]) return;
    this.subscribersMap[key].forEach(sub => {
      sub.update();
    });
  }
}
Publisher.target = null; // static

class Subscriber {
  constructor(exp, vm, fn) {
    this.exp = exp;
    this.vm = vm;
    this.fn = fn;

    Publisher.target = this;
    let expArr = exp.trim().split(".");
    let value = vm;
    for (let e of expArr) {
      value = value[e];
    }
    Publisher.target = null;
  }

  update() {
    this.fn();
  }
}

class TemplateCompliler {
  compile(vm) {
    this.vm = vm;
    let fragment = document.createDocumentFragment();
    let child;
    while ((child = vm.$el.firstChild)) {
      fragment.appendChild(child);
    }

    this.replace(fragment);
    vm.$el.appendChild(fragment);
  }

  /**
   *  递归替换整个DOM，逐个处理所有 Node，如果这个 Node 的类型为——
   * 1. 字符节点，则直接找到 {{}} 匹配的字符串，将其中的表达式替换成对应data中对应的值。
   * 2. 元素节点，则主要处理其属性，比如 "v-bind" 和 "v-model" 等， 将属性值修改为 data中对应的值。
   *
   * @param {*} fragment
   * @memberof TemplateCompliler
   */
  replace(fragment) {
    Array.from(fragment.childNodes).forEach(node => {
      let reg = /\{\{(.*)\}\}/g;
      if (node.nodeType == Node.TEXT_NODE && reg.test(node.textContent)) {
        let exp = RegExp.$1;
        this.replaceTextNode(exp, node);
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        this.replaceElementNode(node);
      }

      // 递归编译
      if (node.childNodes && node.childNodes.length) {
        this.replace(node);
      }
    });
  }

  replaceTextNode(exp, node) {
    let vm = this.vm;
    let reg = /\{\{(.*)\}\}/g;
    let value = vm._getValueByExpressionString(exp);
    let originTextContent = node.textContent; // backup it.
    node.textContent = node.textContent.replace(reg, value);

    // subscribe the data change.
    new Subscriber(exp, vm, () => {
      let value = vm._getValueByExpressionString(exp);
      node.textContent = originTextContent.replace(reg, value);
    });
  }

  replaceElementNode(node) {
    Array.from(node.attributes).forEach(attr => {
      let attrName = attr.name;
      let exp = attr.value;

      // directives
      if (attrName.startsWith("v-bind:") || attrName.startsWith(":")) {
        this.replaceDirectiveVBind(exp, node, attrName);
      } else if (attrName.startsWith("v-model")) {
        this.replaceDirectiveVModel(exp, node);
      }
    });
  }

  replaceDirectiveVBind(exp, node, attrName) {
    let vm = this.vm;
    let attrValue = vm._getValueByExpressionString(exp);
    let directiveName = attrName.split(":")[1];

    node.setAttribute(directiveName, attrValue);
    node.removeAttribute(attrName);

    // subscribe the data changes.
    new Subscriber(exp, vm, () => {
      attrValue = vm._getValueByExpressionString(exp);
      node.setAttribute(directiveName, attrValue);
    });
  }

  replaceDirectiveVModel(exp, node) {
    let vm = this.vm;
    let value = vm._getValueByExpressionString(exp);
    node.value = value;

    // subscribe the data changes.
    new Subscriber(exp, vm, () => {
      let value = vm._getValueByExpressionString(exp);
      node.value = value;
    });

    // listen the view changes.
    node.addEventListener("input", e => {
      let newVal = e.target.value;
      vm._setValueByExpressionString(exp, newVal);
    });
  }
}

class MyVue {
  constructor(options) {
    let { el, data, computed } = options;
    this._options = options;
    this.$el = document.querySelector(el);

    // 数据劫持、数据代理到this.
    this.data = data.call(this);
    this.data = this.hijackObject(this.data);
    this.proxyDataToThis(); // make it possible to access this.data.name by this.name

    // 处理 computed
    this.addComputedData(computed);

    // 编译模板
    (new TemplateCompliler()).compile(this);
  }

  // 使用 Proxy 进行数据劫持。
  // 注意，由于使用 Proxy 进行数据劫持的时候劫持的是对象，而不像 defineProperty 劫持了属性，
  // 故此处的实现与 Vue 官方的有巨大不同。
  hijackObject(object) {
    // 每个对象对应一个 publisher
    let publisher = new Publisher();

    // 只将对象进行递归劫持。
    for (let prop in object) {
      if (Object.prototype.toString.call(object[prop]) === "[object Object]") {
        object[prop] = this.hijackObject(object[prop]);
      }
    }

    let hijackedObject = new Proxy(object, {
      get(target, key, proxy) {
        // 这是最巧妙的，通过拦截get,将 subscriber 加到 publisher里面去。
        // 虽然巧妙，但非常不好阅读和理解。
        if (Publisher.target) {
          publisher.addSub(key, Publisher.target);
        }
        return Reflect.get(target, key, proxy);
      },
      set(target, key, value, proxy) {
        let isSucceed = Reflect.set(target, key, value, proxy);
        publisher.notify(key);
        return isSucceed;
      }
    });

    // 返回被劫持之后的object
    return hijackedObject;
  }

  proxyDataToThis() {
    for (let key in this.data) {
      Object.defineProperty(this, key, {
        get() {
          return this.data[key];
        },
        set(val) {
          this.data[key] = val;
        }
      });
    }
  }

  addComputedData(computed) {
    for (let key in computed) {
      if (Array.prototype.toString.call(computed[key]) === "[object Function]") {
        // function
        Object.defineProperty(this, key, {
          get() {
            let cachedValue = computed[key].call(this);
            return cachedValue;
          },
          set(val) {
            throw new Error("set 你个大头鬼你 set computed");
          }
        });
      } else if (Array.prototype.toString.call(computed[key]) === "[object Object]") {
        // object with get() & set()
        Object.defineProperty(this, key, {
          get() {
            let cachedValue = computed[key].get.call(this);
            return cachedValue;
          },
          set(val) {
            computed[key].set.call(this, val);
          }
        });
      }
    }
  }

  /**
   *
   * set data according to expression:
   *                   exp = val       ==>
   *     "bestFriend.name" = "Caren"   ==>
   *  this.bestFriend.name = "Caren"
   *
   * @param {String} exp
   * @param {*} val
   * @memberof MyVue
   */
  _setValueByExpressionString(exp, val) {
    let expArr = exp.trim().split(".");
    let data = this.data;

    for (let i = 0; i < expArr.length - 1; i++) {
      data = data[expArr[i]];
    }
    data[expArr[expArr.length - 1]] = val;
  }

  /**
   *
   *  return the value of expression.
   *  for example:
   *  "bestFriend.name" --> this.bestFriend.name
   *
   * @param {String} exp
   * @returns the value of {{exp}}
   * @memberof MyVue
   */
  _getValueByExpressionString(exp) {
    let expArr = exp.trim().split(".");
    let value = this;
    for (let e of expArr) {
      value = value[e];
    }
    return value;
  }
}
