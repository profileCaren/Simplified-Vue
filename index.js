let myVue = new MyVue({
  el: "#app",
  data: () => {
    return {
      name: "Christina",
      age: 22,
      height: 167,
      description: "A stupid girl.",
      bestFriend: {
        name: "Somebody",
        age: 12
      }
    };
  }
});

// console.log("-------");
// console.log(myVue.name);
// console.log("-------");
// myVue.name = "Christina Tan";
// console.log("-------");
// console.log(myVue.name);
// console.log("-------");
// console.log(myVue.data.name);
