import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router"; // or react-router-dom depending on your install
import {
  User,
  Search,
  Users,
  Activity,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { api } from "../api";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePic);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const dpInputRef = useRef(null);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;

    setIsPosting(true);
    const formData = new FormData();
    if (postContent) formData.append("content", postContent);
    if (postImage) formData.append("image", postImage); // Make sure 'image' matches your backend multer field

    try {
      await api.post("/posts", formData);
      setPostContent("");
      setPostImage(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleComments = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleToggleFollowers = async () => {
    const willShow = !showFollowers;
    setShowFollowers(willShow);

    if (willShow) {
      try {
        const data = await api.get(`/users/${user.id}/profile`);
        setFollowersList(data.user.followers || []);
      } catch (err) {
        console.error("Failed to fetch followers list", err);
      }
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`, {});
      fetchDashboardData(); // Refresh to update like count
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const postsData = await api.get("/posts");
      setPosts(postsData);
      const messagesData = await api.get("/users/recent-messages");
      setRecentMessages(messagesData);
      if (user?.id) {
        const profileData = await api.get(`/users/${user.id}`);
        setStats(profileData.stats);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const results = await api.get(`/users/search?query=${query}`);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { content });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchDashboardData(); // Refresh posts to show the new comment count
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  useEffect(() => {
    if (user?.profilePic) {
      setAvatarUrl(user.profilePic);
    }
  }, [user?.profilePic]);

  const handleDpUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      console.log("Sending payload to backend...");
      const updatedUser = await api.post("/users/dp", formData);
      console.log("Backend response:", updatedUser);

      if (updatedUser?.profilePic) {
        setAvatarUrl(updatedUser.profilePic);
        console.log("React state updated! Image should now be visible.");
      }
    } catch (err) {
      console.error("Upload failed in Dashboard:", err);
    } finally {
      if (dpInputRef.current) dpInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="dashboard-container">
      {/* LEFT MARGIN */}
      <div className="left-margin">
        <div className="search-bar" style={{ position: "relative" }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search users..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #ccc",
                zIndex: 10,
              }}
            >
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  style={{
                    padding: "0.5rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => navigate(`/user/${result.id}`)}
                >
                  {result.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn-text"
          onClick={handleToggleFollowers}
          style={{ cursor: "pointer" }}
        >
          <Users size={16} /> Followers{" "}
          {stats ? `(${stats.totalFollowers})` : ""}
        </button>

        {showFollowers && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                margin: "0 0 10px 0",
                fontSize: "0.85rem",
                color: "#555",
              }}
            >
              Top Followers
            </h4>

            {followersList.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#888", margin: 0 }}>
                Loading or no followers...
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {followersList.slice(0, 10).map((followRecord) => {
                  const follower = followRecord.follower;
                  return (
                    <li
                      key={follower.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <img
                        src={follower.profilePic || "/default-avatar.png"}
                        alt={follower.name}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          marginRight: "10px",
                          objectFit: "cover",
                          backgroundColor: "#ccc",
                        }}
                      />
                      <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                        {follower.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="stats-section">
          <h4
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: "0 0 0.5rem 0",
            }}
          >
            <Activity size={16} /> Stats
          </h4>
          <ul className="stats-list">
            <li>
              Joined:{" "}
              {stats
                ? new Date(stats.joinedAt).toLocaleDateString()
                : "Loading..."}
            </li>
            <li>Posts: {stats?.totalPosts || 0}</li>
            <li>Comments: {stats?.totalComments || 0}</li>
            <li>Likes: {stats?.totalLikes || 0}</li>
          </ul>
        </div>
      </div>

      {/* CENTER FEED */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minHeight: "80px",
              marginBottom: "10px",
              resize: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPostImage(e.target.files[0])}
              style={{ fontSize: "0.85rem" }}
            />
            <button
              type="submit"
              disabled={isPosting}
              style={{
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: isPosting ? "not-allowed" : "pointer",
              }}
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
      <div className="center-feed">
        <div className="profile-area">
          <input
            type="file"
            id="dp-upload"
            style={{ display: "none" }}
            accept="image/*"
            ref={dpInputRef}
            onChange={handleDpUpload}
          />
          <div
            className="avatar"
            style={{ cursor: "pointer" }}
            onClick={() => dpInputRef.current.click()}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="DP"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <User size={30} color="#aaa" />
            )}
          </div>
          <h2 style={{ margin: 0 }}>{user?.name}</h2>
          <small style={{ color: "#888" }}>Click avatar to update DP</small>
        </div>

        <div className="posts-area">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              {/*  Clickable Profiles */}
              <strong
                style={{
                  cursor: "pointer",
                  color: "#007bff",
                  textDecoration: "underline",
                }}
                onClick={() => navigate(`/user/${post.author.id}`)}
              >
                {post.author?.name}
              </strong>
              <p style={{ margin: "0.5rem 0" }}>{post.content}</p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => handleLike(post.id)}
                  className="btn-text"
                  style={{ padding: 0 }}
                >
                  ❤️ {post._count?.likes || 0} Likes
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="btn-text"
                  style={{ padding: 0 }}
                >
                  💬 {post._count?.comments || 0} Comments
                </button>
              </div>
              {expandedPosts[post.id] && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "8px",
                  }}
                >
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          borderBottom: "1px solid #eee",
                          paddingBottom: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>{comment.author?.name}: </strong>
                        <span>{comment.content}</span>
                      </div>
                    ))
                  ) : (
                    <small>No comments yet.</small>
                  )}
                </div>
              )}
              {post.mediaType === "IMAGE" && post.mediaUrl && (
                <img
                  src={post.mediaUrl}
                  alt="Post media"
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
              )}
              {post.mediaType === "AUDIO" && post.mediaUrl && (
                <audio
                  controls
                  src={post.mediaUrl}
                  style={{ width: "100%" }}
                ></audio>
              )}

              {/* Comment Input UI */}
              <div
                style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  style={{ flex: 1, padding: "0.25rem" }}
                  value={commentInputs[post.id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => handleCommentSubmit(post.id)}>
                  Comment
                </button>
              </div>
              <small style={{ color: "gray" }}>
                {post._count?.comments || 0} Comments
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MARGIN */}
      <div className="right-margin">
        <button onClick={() => navigate("/messages")} className="primary-btn">
          <MessageSquare size={18} /> Go to Messages
        </button>

        <div>
          <h3 style={{ margin: "0 0 1rem 0" }}>Recent Messages</h3>
          <ul className="msg-list">
            {recentMessages.map((msg) => (
              <li key={msg.id} className="msg-item">
                <strong style={{ fontSize: "0.9rem" }}>
                  {msg.isSender ? "From: " : "From: "} {msg.sender}
                </strong>
                <p className="msg-preview">
                  {msg.preview}
                  {msg.preview.length === 20 ? "..." : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleLogout}
          className="btn-text"
          style={{
            marginTop: "auto",
            alignSelf: "flex-end",
            color: "red",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
