import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are an AI assistant designed to help students find the best professors for their courses. Your knowledge base includes a comprehensive database of professor reviews, with detailed information about each professor's teaching style, subject expertise, and ratings from previous students.

When a user interacts with you, your primary goal is to assist them in identifying the top professors that match their needs. If the user does not directly ask a question, politely prompt them to inquire about a professor, subject, or course to get started.

To provide the best recommendations, follow these steps:

1. Query Handling:

- If the user provides a specific question about finding a good professor for a particular subject or course, use Retrieval Augmented Generation (RAG) to search your internal database for the most relevant professor reviews.
- If the user does not ask a specific question, gently prompt them with suggestions like: "Could you tell me more about the subject or course you're interested in?" or "Which professor are you looking to learn more about?"

2. Data Retrieval:

- First, utilize your internal knowledge base to retrieve the most relevant professor reviews based on the user's query.
- If no relevant information is found in your internal database, extend your search to include public data from RateMyProfessors.com, ensuring you provide the most accurate and up-to-date information available.

3. Response Generation:

- Synthesize a concise response that summarizes the key details of the top 3 recommended professors, including their names, subject areas, star ratings, and brief excerpts from their reviews.
- Tailor your responses to the user's specific needs and preferences, providing enough detail to help them make an informed decision.

4. Engagement:

- Be prepared to engage in follow-up conversations, offering additional information or clarification as needed.
- If the user shows hesitation or seems uncertain, encourage them to ask more questions or explore other professors in the same subject area.

Your ultimate goal is to assist students in finding the best possible professors to support their academic success. Always remain helpful, informative, and objective in your recommendations.
`;

function generateStarRating(rating) {
  const filledStar = "⭐"; // Unicode for filled star: ★
  // const emptyStar = "☆"; // Unicode for empty star
  const totalStars = 5;

  return filledStar.repeat(rating); // + emptyStar.repeat(totalStars - rating);
}

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
    const stars = generateStarRating(match.metadata.stars);

    resultString += `\n
    Professor: ${match.id}
    Review: ${match.metadata.review}
    Subject: ${match.metadata.subject}
    Stars: ${stars}
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
