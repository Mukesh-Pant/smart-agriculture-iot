import jwt from "jsonwebtoken";
import { promisify } from "util";

const verifyAsync = promisify(jwt.verify);

async function authToken(req, res, next) {
  try {
    const token = {
      backend_token: req.cookies?.backend_token,
      session_token: req.cookies?.token,
    };

    if (!token.backend_token && !token.session_token) {
      return res.status(401).json({
        message: "You have to login first.",
        error: true,
        success: false,
      });
    }

    const decoded_backendToken = token.backend_token
      ? await verifyAsync(token.backend_token, process.env.TOKEN_SECRET_KEY)
      : null;

    const decoded_sessionToken = token.session_token
      ? await verifyAsync(token.session_token, process.env.AUTH_SECRET)
      : null;

    if (!decoded_backendToken?.id) {
      return res.status(403).json({
        message: "backend_token is invalid.",
        error: true,
        success: false,
      });
    }

    console.log("decoded_backendToken", decoded_backendToken);
    console.log("decoded_sessionToken", decoded_sessionToken);
    req.userId = decoded_backendToken.id;

    next();
    
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({
      message: "Authentication failed.",
      error: true,
      success: false,
    });
  }
}

export default authToken;
