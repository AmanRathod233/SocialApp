export const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://social-app-yqn4.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return await fn(req, res);
};
