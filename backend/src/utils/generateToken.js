import { signAccessToken } from "./authTokens.js";

const generateToken = (userId) => {
  return signAccessToken({ _id: userId, role: "user" });
};

export default generateToken;
