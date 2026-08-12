import { useState } from "react";
import "./App.css";
import API_URL from "./config";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addUser = async () => {
    // Basic validation
    if (!name || !email) {
      alert("Please enter both name and email.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/add-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        alert(data.message || "Failed to add user.");
        return;
      }

      console.log("Success:", data);

      alert("User added successfully!");

      // Clear inputs
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Connection error:", error);
      alert("Could not connect to the Flask backend.");
    }
  };

  return (
    <div className="text-red-500 p-5">
      <h1 className="text-2xl font-bold mb-4">
        Flask + MongoDB Test
      </h1>

      <div className="mb-4">
        <input
          className="border border-black mr-2 px-3 py-2"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border border-black px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
          onClick={addUser}
        >
          Add User
        </button>
      </div>
    </div>
  );
}

export default App;