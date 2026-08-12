import { useState } from "react";
import "./App.css";
import API_URL from "./config";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addUser = async () => {
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

      console.log(data);
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <div className="text-red-500">
      <h1>Flask + MongoDB Test</h1>

      <input
        className="border border-black mr-2"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border border-black"
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
  );
}

export default App;