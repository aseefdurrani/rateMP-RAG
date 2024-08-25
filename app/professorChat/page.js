"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CustomModal from "../components/CustomModal";

export default function Home() {
  const router = useRouter();

  const handleHome = () => {
    router.push("/");
  };

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi I'm the Rate My Professor support assistant, also known as ProfInsight.\nHow can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [inputLink, setInputLink] = useState(""); // State for the input link
  const [scrapedData, setScrapedData] = useState(null); // State for storing scraped data
  const [modalOpen, setModalOpen] = useState(false);  // State to manage modal open/close
  const [currentReview, setCurrentReview] = useState(""); // State for the review content in the modal
  const [loading, setLoading] = useState(false); // State to manage loading

  const formatScore = (score) => {
    return parseFloat(score).toFixed(1) + "/5.0";
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (message.trim()) {
        sendMessage();
      }
    }
  };

  const handleLinkSubmit = async () => {
    if (!inputLink.trim()) return;

    setLoading(true); // Set loading to true when starting the request

    try {
      const response = await fetch("/api/scrape-and-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputLink }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.metadata) {
          if (result.metadata.reviews) {
            result.metadata.reviews = JSON.parse(result.metadata.reviews);
          }
          setScrapedData(result.metadata);
          alert("Link processed successfully, and data inserted into Pinecone!");
          console.log("Link submitted and data inserted:", result);
        } else {
          alert("No metadata received.");
          console.log("No metadata received:", result);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to submit link:", errorData);
        alert(`Error: ${errorData.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error("Error submitting link:", error);
      alert(`Error: ${error.message}`);
    }

    setLoading(false); // Set loading to false after the request is complete
    setInputLink(""); // Clear the input field after submission
  };

  const openModal = (review) => {
    setCurrentReview(review);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="bg-customBg min-h-screen flex flex-col">
      <div className="navbar bg-customPrimary text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">ProfInsight</a>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost" onClick={handleHome}>
            Go Home
          </button>
        </div>
      </div>
      <div className="w-screen h-screen flex justify-center items-center p-4">
        <div className="flex flex-col w-full h-full border border-black p-4 space-y-3 max-w-screen-xl">
          <div className="flex flex-grow space-x-4 h-full">
            {/* Left side input section */}
            <div className="w-1/3 bg-white p-4 border border-gray-300 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Submit a Professor Link</h2>
              <input
                type="text"
                placeholder="Enter RateMyProfessors link"
                className="input input-bordered w-full mb-4"
                value={inputLink}
                onChange={(e) => setInputLink(e.target.value)}
                disabled={loading} // Disable input during loading
              />
              <button
                className={`btn w-full ${loading ? "bg-gray-400" : "bg-customPrimary text-white"}`}
                onClick={handleLinkSubmit}
                disabled={loading} // Disable button during loading
              >
                {loading ? "Loading..." : "Submit Link"}
              </button>

              {/* Display scraped data if available */}
              {scrapedData && (
                <div className="mt-4 p-4 bg-customPrimary text-white rounded-lg border border-secondary">
                  <h3 className="text-lg font-semibold mb-2">Professor Details</h3>
                  <p><strong>Name:</strong> {scrapedData.professor || 'N/A'}</p>
                  <p><strong>School:</strong> {scrapedData.school || 'N/A'}</p>
                  <p><strong>Department:</strong> {scrapedData.department || 'N/A'}</p>
                  <p><strong>Stars:</strong> {formatScore(scrapedData.stars)}</p>
                  <p><strong>Would Take Again:</strong> {scrapedData.would_take_again || 'N/A'}</p>
                  <p><strong>Difficulty:</strong> {formatScore(scrapedData.overall_difficulty)}</p>
                  <h4 className="text-md font-semibold mt-4">Most Recent Review:</h4>
                  {scrapedData.reviews && scrapedData.reviews.length > 0 ? (
                    <div className="p-2 bg-green-800 text-white border border-primary rounded-lg">
                      <p><strong>Class:</strong> {scrapedData.reviews[0].class || 'N/A'}</p>
                      <p><strong>Quality:</strong> {formatScore(scrapedData.reviews[0].quality)}</p>
                      <p><strong>Difficulty:</strong> {formatScore(scrapedData.reviews[0].difficulty)}</p>
                      <p>
                        {scrapedData.reviews[0].review.slice(0, 100)}...
                        <button
                          className="text-blue-500 ml-2 underline"
                          onClick={() => setModalOpen(true)}
                        >
                          Read More
                        </button>
                      </p>
                    </div>
                  ) : (
                    <p>No reviews available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Right side chat section */}
            <div className="flex flex-col w-2/3 h-full border border-black p-4 space-y-3">
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
                    <div className="chat-header text-customAI">
                      {message.role === "assistant" ? "ProfInsight" : "User"}
                    </div>
                    <div
                      className={
                        message.role === "assistant"
                          ? "chat-bubble bg-customAI"
                          : "chat-bubble bg-customPrimary text-white"
                      }
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
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
                  onKeyDown={handleKeyDown} // Handle Enter key press
                />
                <button
                  className={`btn flex items-center justify-center ${
                    message.trim()
                      ? "bg-customPrimary text-white"
                      : "bg-gray-300 text-customPrimary/70 cursor-not-allowed"
                  }`}
                  onClick={sendMessage}
                  disabled={!message.trim()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10l9-9m0 0l9 9m-9-9v18"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      <CustomModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Full Review</h2>
        <p>{scrapedData && scrapedData.reviews[0].review}</p>
        <button
          onClick={() => setModalOpen(false)}
          className="mt-4 btn bg-customPrimary text-white"
        >
          Close
        </button>
      </CustomModal>
    </div>
  );
}
