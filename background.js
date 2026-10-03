// background.js
console.log("ChatHomeBase Premium Helper Background Service Worker Active (Server Mode Fixed)");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Route 1: Generating the AI Reply via Local Server
  if (request.type === "GENERATE_REPLY") {
    
    // Convert your array history into a single string for the server
    const conversationString = Array.isArray(request.agentHistory) 
      ? request.agentHistory.join('\n') 
      : (request.agentHistory || "");

    fetch("http://localhost:3001/suggest-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Correctly mapping the keys from your content.js to the server.js format
      body: JSON.stringify({
        conversation: conversationString,
        latestCustomerMessage: request.incomingMessage, // Fixed key mapping
        myStyle: request.myStyle || []
      })
    })
    .then(response => response.json())
    .then(data => {
      // Prevents "undefined" from pasting if the server kicks back an error
      if (data.error) {
        console.error("Server returned error:", data.error);
        sendResponse({ reply: "... (Server error, try again)" });
      } else {
        sendResponse(data);
      }
    })
    .catch(error => {
      console.error("Error communicating with local server:", error);
      sendResponse({ reply: "... (Node server offline)" });
    });

    return true; 
  }

  // Route 2: Saving Your Typing Style to the Local Server Database
  if (request.type === "SAVE_LEARNING") {
    fetch("http://localhost:3001/save-learning", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request.payload)
    })
    .then(response => response.json())
    .then(data => sendResponse(data))
    .catch(error => {
      console.error("Error saving learning data:", error);
      sendResponse({ ok: false });
    });

    return true; 
  }
});