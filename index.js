let myVue = new MyVue({
  el: "#app",
  data: function() {
    console.log(this);
    return {
      name: "Christina",
      age: 21,
      height: 167,
      description: "A stupid girl.",
      bestFriend: {
        name: "Caren",
        age: 12,
        link: "http://laijiawen.com/",
      }
    };
  }
});

// myVue.description = "如果你看到这句话，说明 数据 -> 视图绑定成功"

// console.log("-------");
// console.log(myVue.name);
// console.log("-------");
// myVue.name = "Christina Tan";
// console.log("-------");
// console.log(myVue.name);
// console.log("-------");
// console.log(myVue.data.name);
