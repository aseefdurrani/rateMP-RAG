"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi I'm the Rate My Professor support assistant, how can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");

  const handleAsk = () => {
    router.push("/professorChat");
  };

  const handleFilter = () => {
    router.push("/filter");
  };

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
      <div className="navbar bg-customPrimary text-white justify-between ">
        <div className="flex w-full justify-between items-center">
          <div className="flex">
            <a className="btn btn-ghost text-xl">ProfInsight</a>
          </div>
          {/* <div className="flex-none">
            <ul className="menu menu-horizontal px-1 ">
              <li>
                <details>
                  <summary>Get Started</summary>
                  <ul className="bg-customPrimaryLight rounded-t-none p-2 text-black ">
                    <li>
                      <a>Login</a>
                    </li>
                    <li>
                      <a>Sign Up</a>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          </div> */}
        </div>
      </div>
      <div className="flex flex-grow flex-col justify-center items-center">
        <h1 className="text-6xl font-bold text-center mt-10 text-customPrimary">
          Welcome to ProfInsight
        </h1>
        <h2 className="text-2xl text-center mt-5 text-customAI">
          All in one place to learn about your professors
        </h2>
        <div className="flex flex-row justify-center items-center gap-4">
          <button
            className="btn btn-outline mt-8 text-customPrimary border-customPrimary hover:bg-customPrimary hover:text-customPrimaryLight"
            onClick={handleAsk}
          >
            Search Professors
          </button>
          <button
            className="btn btn-outline mt-8 text-customPrimary border-customPrimary hover:bg-customPrimary hover:text-customPrimaryLight"
            onClick={handleFilter}
          >
            Filter Professors
          </button>
        </div>
      </div>
    </div>
  );
}
