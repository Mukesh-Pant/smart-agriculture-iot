import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";

/**
 * GET /api/settingCookies
 * Header: Authorization: Bearer <backendToken>
 *
 * Verifies the login-issued JWT, then re-issues a fresh httpOnly
 * `backend_token` cookie with the user's CURRENT role, status, and device
 * assignments (re-read from the DB). This keeps device-access claims fresh
 * after an admin reassigns devices — the user just needs to revisit.
 */
async function SettingCookies(req, res) {
  try {
    const bearer = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;

    if (!bearer) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Missing authentication token.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(bearer, process.env.TOKEN_SECRET_KEY);
    } catch {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Invalid or expired token.",
      });
    }

    // Re-read the live user so claims (role/status/devices) are current.
    const user = await UserModel.findById(decoded.id).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: true, message: "User not found." });
    }

    // A suspended/rejected user must not keep a working session cookie.
    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Account is not active.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        user_role: user.user_role,
        status: user.status,
        device_id: user.device_id || null,
        devices: Array.isArray(user.devices) ? user.devices : [],
      },
      process.env.TOKEN_SECRET_KEY,
      { expiresIn: "30d" }
    );

    // Behind nginx everything is same-origin over HTTPS, so a Lax,
    // Secure, httpOnly cookie is the right call. (Express must trust the
    // proxy for `secure` to register correctly — see index.js.)
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };

    return res.cookie("backend_token", token, cookieOptions).json({
      success: true,
      error: false,
      message: "Session cookie set.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to set session cookie.",
    });
  }
}

export default SettingCookies;
