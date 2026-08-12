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
        name,
        email,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message);

      // Clear inputs after successful insertion
      setName("");
      setEmail("");
    } else {
      alert(data.message);
    }

  } catch (error) {
    console.error("Error adding user:", error);
    alert("Unable to connect to the Flask server.");
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