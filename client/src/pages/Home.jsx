// Home.jsx - COMPLETE VERSION WITH FACEBOOK PAGE & INSTAGRAM SUPPORT
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState("reel");
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("facebook");

  // Instagram & Facebook Info
  const [accountInfo, setAccountInfo] = useState(null); // Instagram
  const [pageInfo, setPageInfo] = useState(null); // Facebook Page

  // ======================= CONNECT BUTTONS =======================
  const handleConnectMeta = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }
    window.location.href = `http://localhost:30000/api/meta/auth?token=${token}`;
  };

  const handleConnectInstagram = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }
    window.location.href = `http://localhost:30000/api/instagram/auth?token=${token}`;
  };

  const handleConnectFacebookPage = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      navigate("/login");
      return;
    }
    window.location.href = `http://localhost:30000/api/facebook/connectPage?token=${token}`;
  };

  // ======================= INFO BUTTONS =======================
  const handleGetAccountInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first.");

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:30000/api/instagram/getAccountInfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAccountInfo(response.data.data);
      alert("✅ Instagram account info loaded!");
    } catch (err) {
      console.error("Instagram account info error:", err);
      const errorMessage = err.response?.data?.error || "Failed to get Instagram account info";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFacebookPageInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first.");

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:30000/api/facebook/getPageInfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPageInfo(response.data.data);
      alert("✅ Facebook Page info loaded!");
    } catch (err) {
      console.error("Facebook Page info error:", err);
      const errorMessage = err.response?.data?.error || "Failed to get Facebook Page info";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ======================= LOGOUT =======================
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ======================= UPLOAD POST =======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first.");

    setLoading(true);

    let requestData;
    let requestHeaders = { Authorization: `Bearer ${token}` };

    if (type === "text") {
      requestData = { caption };
      requestHeaders["Content-Type"] = "application/json";
    } else {
      const formData = new FormData();
      if (file && type !== "text") {
        if (type === "image") formData.append("image", file);
        else if (type === "reel" || type === "video") formData.append("video", file);
      }
      formData.append("caption", caption);
      requestData = formData;
      requestHeaders["Content-Type"] = "multipart/form-data";
    }

    let endpoint = "";
    if (platform === "facebook") {
      switch (type) {
        case "reel": endpoint = "/api/facebook/uploadReel"; break;
        case "video": endpoint = "/api/facebook/uploadVideo"; break;
        case "image": endpoint = "/api/facebook/uploadImage"; break;
        case "text": endpoint = "/api/facebook/uploadTextPost"; break;
        default: setLoading(false); return alert("Invalid upload type selected");
      }
    } else if (platform === "instagram") {
      switch (type) {
        case "reel": endpoint = "/api/instagram/uploadReel"; break;
        case "video": endpoint = "/api/instagram/uploadVideo"; break;
        case "image": endpoint = "/api/instagram/uploadImage"; break;
        case "text": setLoading(false); return alert("Instagram doesn't support text-only posts");
        default: setLoading(false); return alert("Invalid upload type selected");
      }
    }

    try {
      await axios.post(`http://localhost:30000${endpoint}`, requestData, {
        headers: requestHeaders,
        timeout: 120000,
      });

      alert("✅ Post successful!");
      setCaption("");
      setFile(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Upload failed";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ======================= UI =======================
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Welcome to the Home Page</h1>

      {/* Facebook / Meta */}
      <button onClick={handleConnectMeta} style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#1877F2", color: "#fff", border: "none", borderRadius: "5px" }}>
        Connect to Facebook / Meta
      </button>

      <button onClick={handleGetFacebookPageInfo} disabled={loading} style={{ marginLeft: "10px", padding: "10px 20px", fontSize: "16px", backgroundColor: loading ? "#ccc" : "#3b5998", color: "#fff", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer" }}>
        Get Facebook Page Info
      </button>

      <button onClick={handleGetAccountInfo} disabled={loading} style={{ marginLeft: "10px", padding: "10px 20px", fontSize: "16px", backgroundColor: loading ? "#ccc" : "#405DE6", color: "#fff", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer" }}>
        Get Instagram Info
      </button>

      {/* Facebook Page Info Block */}
      {pageInfo && (
        <div style={{ backgroundColor: "#000", border: "1px solid #dee2e6", borderRadius: "8px", padding: "15px", margin: "20px auto", maxWidth: "400px", textAlign: "left" }}>
          <h4>📄 Facebook Page</h4>
          <p><strong>Name:</strong> {pageInfo.name}</p>
          <p><strong>ID:</strong> {pageInfo.id}</p>
          <p><strong>Category:</strong> {pageInfo.category}</p>
          <p><strong>Followers:</strong> {pageInfo.followers_count?.toLocaleString()}</p>
          <p><strong>Likes:</strong> {pageInfo.likes_count?.toLocaleString()}</p>
        </div>
      )}

      {/* Instagram Info Block */}
      {accountInfo && (
        <div style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #dee2e6", borderRadius: "8px", padding: "15px", margin: "20px auto", maxWidth: "400px", textAlign: "left" }}>
          <h4>📱 Instagram Account</h4>
          <p><strong>Username:</strong> @{accountInfo.username}</p>
          <p><strong>Name:</strong> {accountInfo.name}</p>
          <p><strong>Followers:</strong> {accountInfo.followers_count?.toLocaleString()}</p>
          <p><strong>Following:</strong> {accountInfo.follows_count?.toLocaleString()}</p>
          <p><strong>Posts:</strong> {accountInfo.media_count?.toLocaleString()}</p>
        </div>
      )}

      {/* Create Post Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: "30px", maxWidth: "400px", margin: "auto" }}>
        <h3>Create a Post</h3>

        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ padding: "8px", width: "100%", marginBottom: "10px" }} disabled={loading}>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "8px", width: "100%", marginBottom: "10px" }} disabled={loading}>
          <option value="reel">{platform === "facebook" ? "Facebook" : "Instagram"} Reel</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          {platform === "facebook" && <option value="text">Text Only</option>}
        </select>

        {type !== "text" && (
          <input type="file" accept={type === "image" ? "image/*" : "video/*"} onChange={(e) => setFile(e.target.files[0])} required={type !== "text"} disabled={loading} style={{ display: "block", margin: "10px 0" }} />
        )}

        <textarea placeholder="Enter caption/message" value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} disabled={loading} style={{ width: "100%", padding: "8px" }} required={type === "text"} />

        <button type="submit" disabled={loading || (type !== "text" && !file) || (type === "text" && !caption)} style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px", backgroundColor: loading ? "#ccc" : "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <button onClick={handleLogout} style={{ marginTop: "30px", padding: "10px 20px", fontSize: "16px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
};

export default Home;
