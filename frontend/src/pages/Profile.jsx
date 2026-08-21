import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  User,
  ArrowLeft,
  MessageSquare,
  Heart,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { api } from "../api";

export default function Profile({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await api.get(`/users/${userId}`);

      // Unwrap the backend response structure so profileUser gets the actual user details
      setProfileUser({ ...response.user, stats: response.stats });
      setPosts(response.user.posts || []);
    } catch (error) {
      console.error("Failed to load profile data", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post(`/users/${userId}/unfollow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }
      fetchProfileData();
    } catch (err) {
      console.error("Failed to toggle follow state", err);
      alert(err.response?.data?.error || "Action failed.");
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { content });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchProfileData();
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`, {});
      fetchProfileData();
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profileUser) return <div>User not found.</div>;

  const isFollowing = profileUser.followers?.some(
    (f) => f.follower.id === currentUser.id,
  );

  return (
    <div
      className="dashboard-container"
      style={{ gridTemplateColumns: "100px 1fr 250px" }}
    >
      {/* NARROW LEFT MARGIN */}
      <div className="left-margin">
        <button onClick={() => navigate(-1)} className="btn-text">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* CENTER FEED */}
      <div className="center-feed">
        {/*  Avatar on the left, Name in middle, Buttons on right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="avatar">
            {profileUser.profilePic ? (
              <img
                src={profileUser.profilePic}
                alt="DP"
                style={{ width: 80, height: 80, borderRadius: "50%" }}
              />
            ) : (
              <User size={80} color="#aaa" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 0.5rem 0" }}>{profileUser.name}</h2>
            <p style={{ margin: 0, color: "gray", fontWeight: "bold" }}>
              Followers: {profileUser.stats?.totalFollowers || 0}
            </p>
          </div>

          {/* Action Buttons */}
          {currentUser.id !== profileUser.id && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={toggleFollow}
                className="primary-btn"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: isFollowing ? "#28a745" : "#007bff", // Green if following
                  cursor: isFollowing ? "default" : "pointer",
                  opacity: isFollowing ? 0.9 : 1,
                }}
              >
                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() =>
                  navigate("/messages", { state: { targetUser: profileUser } })
                }
                className="primary-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#333",
                }}
              >
                <MessageSquare size={16} /> Message
              </button>
            </div>
          )}
        </div>

        {/* POSTS TIMELINE */}
        <h3 style={{ marginBottom: "1rem" }}>Posts</h3>

        <div className="posts-area">
          {posts.length === 0 ? (
            <p
              style={{ textAlign: "center", color: "gray", marginTop: "2rem" }}
            >
              No posts yet.
            </p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <p style={{ margin: "0.5rem 0", fontSize: "1.1rem" }}>
                  {post.content}
                </p>

                {post.mediaType === "IMAGE" && post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      marginTop: "1rem",
                    }}
                  />
                )}
                {post.mediaType === "AUDIO" && post.mediaUrl && (
                  <audio
                    controls
                    src={post.mediaUrl}
                    style={{ width: "100%", marginTop: "1rem" }}
                  ></audio>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "1rem",
                    color: "gray",
                  }}
                >
                  <button
                    onClick={() => handleLike(post.id)}
                    className="btn-text"
                    style={{ padding: 0 }}
                  >
                    <Heart size={16} /> {post._count?.likes || 0} Likes
                  </button>
                  <span style={{ fontSize: "0.9rem" }}>
                    {post._count?.comments || 0} Comments
                  </span>
                </div>

                <div
                  style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    className="primary-btn"
                  >
                    Post
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT MARGIN */}
      <div className="right-margin"></div>
    </div>
  );
}
