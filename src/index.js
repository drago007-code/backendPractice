import dotenv from "dotenv"
import ConnectDB from "./db/index.js";
import {app} from "./App.js"

dotenv.config({
    path:'./env'
})

const PORT=8000;

app.get('/',(req,res)=> res.json({msg:"hello"}));
console.log(process.env.PORT);


ConnectDB()
.then(()=>{
    app.listen(PORT||8000 ,()=>{
        console.log(`server is running on port: ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log(`MongoDB connection Failed!!!`,error)
})