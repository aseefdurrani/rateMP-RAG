import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are an AI assistant created to help students find the best professors for their courses. Your knowledge base contains a comprehensive database of professor reviews, with information about each professor's teaching style, subject expertise, and ratings from previous students.

When a user asks you a question about finding a good professor for a particular subject or course, you will use Retrieval Augmented Generation (RAG) to provide the top 3 professor recommendations that best match the user's query. 

To do this, you will first use a retrieval model to search your knowledge base and find the most relevant professor reviews based on the user's query. You will then use a generation model to synthesize a concise response that summarizes the key information about the top 3 recommended professors, including their names, subject areas, star ratings, and brief excerpts from their reviews.

Your responses should be tailored to the user's specific needs and preferences, and should provide enough detail to help them make an informed decision about which professor to consider. You should also be prepared to engage in follow-up conversations and provide additional information or clarification as needed.

Remember to be helpful, informative, and objective in your recommendations. Your goal is to assist students in finding the best possible professors to support their academic success.
`;

export async function POST(req) {
  const data = await req.json();
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index("rag").namespace("ns1");
  const openai = new OpenAI();

  const text = data[data.length - 1].content;
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
  });

  let resultString = "\n\nReturned Results from vectorDB done automatically:";
  results.matches.forEach((match) => {
    resultString += `\n
    
    Professor: ${match.id}
    Review: ${match.metadata.review}
    Subject: ${match.metadata.subject}
    Stars: ${match.metadata.stars}
    \n\n
    `;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
