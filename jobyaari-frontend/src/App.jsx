import React, { useState, useRef, useEffect } from "react";
import { Send, Briefcase, Loader2, MessageSquare } from "lucide-react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { from: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // 1️⃣ Fetch live jobs from backend
      const jobsResp = await axios.get("http://localhost:5000/api/jobs");
      const jobs = jobsResp.data.jobs.slice(0, 50);

      if (!jobs.length) {
        setMessages(prev => [...prev, { from: "bot", text: "⚠️ No jobs available currently." }]);
        setLoading(false);
        return;
      }

      // 2️⃣ Prepare prompt for Gemini API
      const prompt = `
You are JobYaari AI assistant.
Use ONLY the following jobs to answer the user query:

${JSON.stringify(jobs, null, 2)}

User Query: ${userMessage}
Respond clearly, format like:
"Organization - Category (Vacancies: X, Salary: Y, Exp: Z, Qualification: Q)"
`;

      // 3️⃣ Send prompt to Gemini backend proxy
      const genResp = await axios.post("http://localhost:5000/api/generate", { prompt });
      const reply = genResp.data?.text || "No response";

      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { from: "bot", text: "⚠️ Error fetching response." }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] flex flex-col">

        {/* Header */}
        <div className="bg-white rounded-t-xl sm:rounded-t-2xl shadow-lg p-4 sm:p-5 md:p-6 border-b-2 border-indigo-500 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-md">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                JobYaari AI Chatbot
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                Live job data powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white shadow-lg flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-300 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-2">
                  Welcome to JobYaari!
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md">
                  Ask me about job openings, qualifications, salaries, or specific organizations.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
                <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                  m.from === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200"
                }`}>
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-xl sm:rounded-b-2xl shadow-lg p-3 sm:p-4 md:p-5 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about jobs..."
              disabled={loading}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm sm:text-base flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } 
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default App;
