import mongoose from "mongoose"
import { DB_NAME } from "../Constants.js"

const ConnectDB= async()=>{
    try {
        const ConnectionInstance= await mongoose.connect("mongodb+srv://mirzaihtsham45:ihtsham123@cluster0.pyldf.mongodb.net");
        console.log(`\n MONGODB is Connect and DB Host is ${ConnectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MongoDB connection Error",error)
        process.exit(1)
        
    }
}

export default ConnectDB