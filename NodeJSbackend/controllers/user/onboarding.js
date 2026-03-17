import UserModel from "../../models/userModel.js";
import { MongoClient } from "mongodb";

async function userOnboarding(req, res) {
  try {

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db("Agricult");
    // console.log("DB Name:", db.databaseName);

    // console.log("All cookies", req.cookies)

    const sessionToken = req.cookies["authjs.session-token"];
    // console.log("session-Token", sessionToken);

    const { firstName, lastName, device_id, role } = req.body
    
    // const sessions = await db.collection("sessions").find().toArray();
    // console.log("All sessions:", sessions);

    const session = await db.collection("sessions").findOne({ sessionToken });
    // console.log(session)

    let userId;
    let userDetails;

    if (session) {
      userId = session.userId;
      // console.log("User ID:", userId);
    } else {
      return res.json({
        message: "Session not found or expired, please relogin"
      });
    }

    if (userId) {
      userDetails = await UserModel.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName,
          device_id,
          user_role: role,
        },
        { returnDocument: "after" }
      );
    } else {
      return res.json({
        message: "User not found"
      });
    }

    return res.json({
      message: "User updated successfully",
      data: userDetails
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong during updating database"
    });
  }
}

export default userOnboarding;