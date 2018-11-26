class MyVue {
  constructor(options) {
    
    let { el, data } = options;
    this._options = options;
    this.$el = document.querySelector(el);

    this.data = data.call(data);
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
    let child,
      vm = this;
    while ((child = vm.$el.firstChild)) {
      fragment.appendChild(child);
    }
    replace(fragment);
    vm.$el.appendChild(fragment);

    function replace(fragment) {
      Array.from(fragment.childNodes).forEach(node => {
        let txt = node.textContent;
        let reg = /\{\{(.*)\}\}/g;

        // txt: '{{ bestFriend.name }} '
        // RegExp.$1: ' bestFriend.name '
        if (node.nodeType == 3 && reg.test(txt)) {
          let exp = RegExp.$1.trim();
          let expArr = exp.split(".");
          let value;
          for(let e of expArr){
            value = vm[e];
          }
          console.log(value);
          node.textContent = value;
          // txt = value;
        }

        if (node.childNodes && node.childNodes.length) {
          replace(node);
        }
      });
    }

    // // 尝试直接 replace fragment，这是我犯的一个错。
    // function replace(fragment) {
    //   let txt = fragment.textContent;
    //   let reg = /\{\{(.*)\}\}/g;
    //   console.log(typeof txt);
    //   txt = txt.replace(reg, exp => {
    //     let value;
    //     exp = exp.trim().split(".");
    //     for (let e of exp) {
    //       value = vm[e];
    //     }
    //     console.log(value);
    //     return value;
    //   });
    // }
  }
}
