import { useState } from "react";
import "./App.css";

function App() {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const handleAsk = async () => {
    if (!userInput.trim()) return;

    const question = userInput.trim();
    setChatHistory((prev) => [...prev, { type: "user", text: question }]);
    setUserInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });

      const data = await res.json();
      setChatHistory((prev) => [...prev, { type: "bot", text: data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: "❌ Error connecting to the server." },
      ]);
    }

    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please choose a file first.");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert(data.message || "File uploaded and retrained.");
    } catch (err) {
      alert("❌ Error uploading file.");
    }

    setUploading(false);
  };

  return (
    <div className="app">
      <h1>💬 Chat with Your Documents</h1>

      {/* Upload Section */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginRight: "1rem" }}
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {/* Chat Window */}
      <div className="chat-window" style={{ maxHeight: "60vh", overflowY: "auto", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9", marginBottom: "1rem" }}>
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                background: msg.type === "user" ? "#d1e7dd" : "#e2e3e5",
                padding: "0.75rem",
                borderRadius: "12px",
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;