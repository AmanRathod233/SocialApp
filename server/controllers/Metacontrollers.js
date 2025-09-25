import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.FACEBOOK_APP_ID;
const CLIENT_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = "http://localhost:30000/api/meta/callback";

// Step 1: Redirect to Facebook OAuth
export const metaLoginRedirect = (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing user token");

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&scope=pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,instagram_content_publish,instagram_basic,business_management&response_type=code&state=${token}`;

  res.redirect(authUrl);
};

// Step 2: OAuth Callback Handler
export const metaAuthCallback = async (req, res) => {
  const { code, state } = req.query;

  console.log("⚙️ Callback hit");

  try {
    // ✅ Step 1: Get access token
    const tokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenRes.data.access_token;
    console.log("✅ Access token received");

    // ✅ Step 2: Get Meta profile
    const profileRes = await axios.get("https://graph.facebook.com/me", {
      params: {
        access_token: accessToken,
        fields: "id,name,email",
      },
    });

    const { id: metaUserId, name, email } = profileRes.data;
    console.log("✅ Meta profile:", profileRes.data);

    // ✅ Step 3: Get Facebook Pages
    const pagesRes = await axios.get(`https://graph.facebook.com/${metaUserId}/accounts`, {
      params: { access_token: accessToken },
    });

    const pages = pagesRes.data.data.map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
    }));

    console.log("📘 Pages:", pages);

    if (!pages.length) {
      console.warn("⚠️ No Facebook pages found");
    }

    // ✅ Step 4: Get connected Instagram accounts
    const instagramAccounts = [];

    for (const page of pages) {
      try {
        const igRes = await axios.get(
          `https://graph.facebook.com/v19.0/${page.id}?fields=connected_instagram_account`,
          { params: { access_token: page.accessToken } }
        );

        const igAccount = igRes.data.connected_instagram_account;

        if (igAccount?.id) {
          const igDetailRes = await axios.get(
            `https://graph.facebook.com/v19.0/${igAccount.id}?fields=username`,
            { params: { access_token: page.accessToken } }
          );

          instagramAccounts.push({
            igId: igAccount.id,
            username: igDetailRes.data.username,
             pageId: page.id,
  accessToken: page.accessToken,
          });
        }
      } catch (igError) {
        console.error(`❌ IG fetch failed for page ${page.id}:`, igError.response?.data || igError.message);
      }
    }

    console.log("📸 Instagram Accounts:", instagramAccounts);

    // ✅ Step 5: Decode user ID from JWT
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log("🔐 Decoded User ID:", userId);

    // ✅ Step 6: Save to DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          meta: {
            accessToken,
            metaUserId,
            name,
            email,
            connectedAt: new Date(),
            pages,
            instagram: instagramAccounts,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error("❌ User not found in DB");
      return res.status(404).send("User not found");
    }

    console.log("✅ MongoDB updated successfully:", updatedUser.meta);

    res.redirect("http://localhost:5173/home");
  } catch (error) {
    console.error("❌ Meta auth error:", error.response?.data || error.message);
    res.status(500).send("Meta auth failed");
  }
};
