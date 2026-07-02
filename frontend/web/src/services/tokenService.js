const ACCESS_TOKEN_KEY = "personal_cloud_access_token";

let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);

const tokenService = {
  getAccessToken() {
    return accessToken;
  },

  setAccessToken(token) {
    accessToken = token || null;

    if (token) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  },

  clear() {
    accessToken = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

export default tokenService;
