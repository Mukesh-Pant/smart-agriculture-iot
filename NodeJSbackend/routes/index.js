import express from "express";
import userOnboarding from "../controllers/user/onboarding.js";
import SettingCookies from "../controllers/setcookies.js";

const route = express.Router();

route.post("/userOnboarding", userOnboarding)
route.get("/settingCookies", SettingCookies)


export default route;
