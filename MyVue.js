class MyVue {
  constructor(options) {
    let { el, data } = options;
    this._options = options;
    this.$el = document.querySelector(el);

    this.data = data.call(this);
    this.data = this.hijackData(this.data);
    this.proxyDataToThis(); // make it possible to access this.data.name by this.name

    this.compileTemplate();
  }

  // 使用 Proxy 进行数据劫持。
  // 注意，由于使用 proxy 进行数据劫持的时候，劫持的是对象，而不像 defineProperty 劫持了属性，
  // 故此处的实现与 Vue 官方的有巨大不同。
  hijackData(data) {

    for (let prop in data) {
      if (Object.prototype.toString.call(data[prop]) === "[object Object]") {
        data[prop] = this.hijackData(data[prop]);
      }
    }

    let hijackedData = new Proxy(data, {
      get(target, key, proxy) {
        return Reflect.get(target, key, proxy);
      },
      set(target, key, value, proxy) {
        // TODO: need to update the DOM
        return Reflect.set(target, key, value, proxy);
      }
    });
    // 返回被劫持之后的data.
    return hijackedData;
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

  compileTemplate() {
    let fragment = document.createDocumentFragment();
    let child;
    let vm = this;
    while ((child = vm.$el.firstChild)) {
      fragment.appendChild(child);
    }

    replace(fragment);
    vm.$el.appendChild(fragment);

    function replace(fragment) {
      Array.from(fragment.childNodes).forEach(node => {
        let reg = /\{\{(.*)\}\}/g;

        if (node.nodeType == 3 && reg.test(node.textContent)) {
          // 文字节点，并且文字内容包含双大括号 ;
          let exp = RegExp.$1;
          let value = vm._getValueByExpressionString(exp);
          node.textContent = node.textContent.replace(reg, value);
          // TODO: add watcher
        } else if (node.nodeType == 1) {
          // 元素节点
          Array.from(node.attributes).forEach(attr => {
            let name = attr.name;
            let exp = attr.value;

            // directives
            if (name.startsWith("v-bind:") || name.startsWith(":")) {
              // v-bind:href="link"  ==>  href="http://whatever.com"
              let value = vm._getValueByExpressionString(exp);
              let directiveName = name.split(":")[1];

              node.setAttribute(directiveName, value);
              node.removeAttribute(name);

              // v-model
            } else if (name.startsWith("v-model")) {
              let value = vm._getValueByExpressionString(exp);
              node.value = value;

              // TODO: add watcher

              // 视图 --> 数据 的绑定
              node.addEventListener("input", e => {
                let newVal = e.target.value;
                vm._setValueByExpressionString(exp, newVal);
              });
            }
          });
        }

        // 递归
        if (node.childNodes && node.childNodes.length) {
          replace(node);
        }
      });
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
