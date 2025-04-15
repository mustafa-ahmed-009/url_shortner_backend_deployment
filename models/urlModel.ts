import mongoose  from "mongoose";
const urLSchema = new mongoose.Schema({
url:{
    type:String , 
    required:true , 
},
slug : {
    type :String , 
    required:true,  
    unique : true , 
    
} , 
userId : {
    type :String , 
} ,
numberOfClick : {
    type:Number , 
    default : 0 
} , 

})
export const Url = mongoose.model("Url" , urLSchema) ;  