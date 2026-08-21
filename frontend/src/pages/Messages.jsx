import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Image as ImageIcon, Users, Mic } from "lucide-react";
import { io } from "socket.io-client";
import { api, API_URL } from "../api";

export default function Messages({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const passedUser = location.state?.targetUser;

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_URL, { transports: ["websocket"] });
    if (user?.id) socketRef.current.emit("register", user.id);

    const fetchContactsAndGroups = async () => {
      try {
        const [contactsData, groupsData] = await Promise.all([
          api.get("/chat/contacts"),
          api.get("/chat/groups"),
        ]);

        let validContacts = Array.isArray(contactsData) ? contactsData : [];
        let validGroups = Array.isArray(groupsData)
          ? groupsData.map((g) => ({ ...g, isGroup: true }))
          : [];

        if (passedUser) {
          if (!validContacts.find((c) => c.id === passedUser.id)) {
            validContacts.unshift(passedUser);
          }
          setActiveContact(passedUser);
        } else if (validContacts.length > 0) {
          setActiveContact(validContacts[0]);
        }

        setContacts([...validGroups, ...validContacts]);
      } catch (error) {
        console.error("Failed to load chat sidebar", error);
      }
    };

    fetchContactsAndGroups();

    socketRef.current.on("receive_message", (message) =>
      setMessages((prev) => [...prev, message]),
    );
    socketRef.current.on("receive_group_message", (message) =>
      setMessages((prev) => [...prev, message]),
    );
    socketRef.current.on("message_sent", (message) =>
      setMessages((prev) => [...prev, message]),
    );

    return () => socketRef.current.disconnect();
  }, [user, passedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeContact || !user) return;

    const payload = {
      senderId: user.id,
      content: inputText,
      mediaUrl: null,
      mediaType: "NONE",
    };

    if (activeContact.isGroup) {
      payload.groupId = activeContact.id;
      socketRef.current.emit("send_group_message", payload);
    } else {
      payload.receiverId = activeContact.id;
      socketRef.current.emit("send_direct_message", payload);
    }

    setInputText("");
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !activeContact || !user) return;

    const formData = new FormData();
    formData.append("media", file);

    try {
      const res = await api.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = {
        senderId: user.id,
        content: null,
        mediaUrl: res.mediaUrl,
        mediaType: type,
      };

      if (activeContact.isGroup) {
        payload.groupId = activeContact.id;
        socketRef.current.emit("send_group_message", payload);
      } else {
        payload.receiverId = activeContact.id;
        socketRef.current.emit("send_direct_message", payload);
      }
    } catch (err) {
      console.error(`${type} upload failed`, err);
      alert(
        `Failed to upload ${type.toLowerCase()}. Ensure it meets the size limits.`,
      );
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      const newGroup = await api.post("/chat/groups", {
        name: groupName,
        memberIds: selectedMembers,
      });
      setContacts((prev) => [{ ...newGroup, isGroup: true }, ...prev]);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedMembers([]);
    } catch (err) {
      console.error("Failed to create group", err);
      alert(err.response?.data?.error || "Failed to create group.");
    }
  };

  useEffect(() => {
    if (!activeContact) return;

    const fetchChatHistory = async () => {
      try {
        if (!activeContact.isGroup) {
          // Fetch 1-on-1 history
          const history = await api.get(`/chat/history/${activeContact.id}`);
          setMessages(history);
        } else {
          // If you have a group history endpoint, you would call it here
          // const history = await api.get(`/chat/groups/${activeContact.id}/history`);
          // setMessages(history);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchChatHistory();
  }, [activeContact]);

  return (
    <div className="messages-container">
      {/* Contacts Pane */}
      <div className="contacts-pane">
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate("/")} className="btn-text">
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="btn-text"
            style={{ color: "#007bff" }}
          >
            <Users size={16} /> + Group
          </button>
        </div>

        <div style={{ overflowY: "auto" }}>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-item"
              onClick={() => {
                setActiveContact(contact);
                if (contact.isGroup)
                  socketRef.current.emit("join_group", contact.id);
              }}
              style={{
                fontWeight:
                  activeContact?.id === contact.id ? "bold" : "normal",
                backgroundColor:
                  activeContact?.id === contact.id ? "#f0f0f0" : "transparent",
                cursor: "pointer",
                padding: "1rem",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {contact.isGroup ? `👥 ${contact.name}` : contact.name}
            </div>
          ))}
        </div>
      </div>

      {/* Active Chat Window */}
      <div
        className="chat-pane"
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <h3
          className="chat-header"
          style={{ padding: "1rem", borderBottom: "1px solid #eee", margin: 0 }}
        >
          {activeContact
            ? activeContact.isGroup
              ? `👥 ${activeContact.name}`
              : activeContact.name
            : "Select a contact"}
        </h3>

        <div
          className="chat-history"
          style={{ flex: 1, overflowY: "auto", padding: "1rem" }}
        >
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "#007bff" : "#e9ecef",
                  color: isMe ? "#fff" : "#000",
                  padding: "0.75rem 1rem",
                  borderRadius: "16px",
                  maxWidth: "70%",
                  marginBottom: "0.5rem",
                  marginLeft: isMe ? "auto" : "0",
                  marginRight: isMe ? "0" : "auto",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                {/* Render Text */}
                {msg.content && <div>{msg.content}</div>}

                {/* Render Image */}
                {msg.mediaType === "IMAGE" && msg.mediaUrl && (
                  <img
                    src={msg.mediaUrl}
                    alt="attachment"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "4px",
                      marginTop: msg.content ? "0.5rem" : "0",
                    }}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="chat-input-area"
          style={{
            padding: "1rem",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={(e) => handleMediaUpload(e, "IMAGE")}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="btn-text"
            style={{ padding: "0.5rem" }}
          >
            <ImageIcon size={20} color="gray" />
          </button>
          <input
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            ref={audioInputRef}
            onChange={(e) => handleMediaUpload(e, "AUDIO")}
          />
          <button
            onClick={() => audioInputRef.current.click()}
            className="btn-text"
            style={{ padding: "0.5rem" }}
          >
            <Mic size={20} color="gray" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="primary-btn" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>

      {/* Group Creation Modal Overlay */}
      {showGroupModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>Create a Group</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
            />
            <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>
              Select Members:
            </p>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                marginBottom: "1rem",
              }}
            >
              {contacts
                .filter((c) => !c.isGroup && c.name !== "admin")
                .map((contact) => (
                  <div key={contact.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedMembers([
                              ...selectedMembers,
                              contact.id,
                            ]);
                          else
                            setSelectedMembers(
                              selectedMembers.filter((id) => id !== contact.id),
                            );
                        }}
                      />{" "}
                      {contact.name}
                    </label>
                  </div>
                ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                onClick={() => setShowGroupModal(false)}
                className="btn-text"
              >
                Cancel
              </button>
              <button onClick={handleCreateGroup} className="primary-btn">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
