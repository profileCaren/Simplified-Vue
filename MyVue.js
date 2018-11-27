class MyVue {
  constructor(options) {
    let { el, data } = options;
    this._options = options;
    this.$el = document.querySelector(el);

    this.data = data.call(this);
    this.proxyData();

    this.compile();
  }

  proxyData() {
    // 使用 Proxy 进行数据劫持。
    this.data = new Proxy(this.data, {
      get(target, key, proxy) {
        return Reflect.get(target, key, proxy);
      },
      set(target, key, value, proxy) {
        return Reflect.set(target, key, value, proxy);
        // todo: need to update the DOM
      }
    });

    // 数据代理到 this.
    let keys = Object.keys(this.data);
    for (let key of keys) {
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

  compile() {
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

            if (name.startsWith("v-") || name.startsWith(":")) {
              let value = vm._getValueByExpressionString(exp);
              node.value = value;

              // 双向绑定，页面 ==> 数据
              node.addEventListener("input", e => {
                let newVal = e.target.value;
                console.log(exp, newVal);
                vm._setValueByExpressionString(exp, newVal);
              });
            }

            // TODO: add watcher
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
   *  "bestFriend.name" = "Caren"
   *                exp = val
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
