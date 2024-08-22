"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdwon from "react-markdown";

export default function Home() {
  const router = useRouter();

  const handleHome = () => {
    router.push("/");
  };

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "hi im the rate my professor support assistant, how can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    console.log("the message:", message);

    setMessage("");
    const response = fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), {
          stream: !done,
        });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };
  return (
    <div className="bg-customBg min-h-screen flex flex-col ">
      <div className="navbar bg-customPrimary text-white ">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">ProfInsight</a>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost" onClick={handleHome}>
            Go Home
          </button>
        </div>
      </div>
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="flex flex-col w-[800px] h-[700px] border border-black p-4 space-y-3">
          <div className="flex flex-col space-y-2 flex-grow overflow-auto max-h-full">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat ${
                  message.role === "assistant" ? "chat-start" : "chat-end"
                }`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      alt="Avatar"
                      src={
                        message.role === "assistant"
                          ? "/aiavatar.webp"
                          : "/useravatar.webp"
                      }
                    />
                  </div>
                </div>
                <div className="chat-header">
                  {message.role === "assistant"
                    ? "Professor Assistant"
                    : "User"}
                </div>
                <div
                  className={
                    message.role === "assistant"
                      ? "chat-bubble bg-customAI"
                      : "chat-bubble bg-customPrimary text-white"
                  }
                >
                  <ReactMarkdwon>{message.content}</ReactMarkdwon>
                </div>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Message"
              className="input input-bordered w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="btn bg-customPrimary text-white"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
