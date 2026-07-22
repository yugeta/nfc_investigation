import { Init } from "./modules/init.js";

class Main{
  constructor(){
    Init.getInstance().init()
  }
}

switch(document.readyState){
  case "complete":
  case "interactive":
    new Main();break
  default:
    document.addEventListener("DOMContentLoaded",()=>new Main())
}