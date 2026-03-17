import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import { MongoClient} from "mongodb";
import mongoose from "mongoose"

async function SettingCookies(req, res) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db("Agricult");

    const sessionToken = req.cookies["authjs.session-token"];

    const session = await db.collection("sessions").findOne({ sessionToken });

    let userId;
    let userDetails;

    if (session) {
      userId = session.userId;
    } else {
      return res.json({
        message: "Session not found or expired, please relogin",
      });
    }

    const user = await UserModel.findById(new mongoose.Types.ObjectId(userId));
    if (user) {
      const tokenData = {
        id: user._id,
        username: user.firstName,
        email: user.email,
        device_id: user.device_id,
        user_role: user.user_role,
      };

      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
        expiresIn: "1d",
      });
      
      const tokenOption = {
        httpOnly: true,
        secure: true
      }

      res.cookie("backend_token", token, tokenOption).json({
        data: token,
        success: true,
        error: false,
        message: "token added successfully"
      });
    }else {
        throw new Error("Something went wrong with jwt token");
    }

  } catch (error) {
    res.json({
        message : error.message || error
    },{
        status:500
    })
  }
}

export default SettingCookies
