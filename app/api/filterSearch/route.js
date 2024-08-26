import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
You are an AI assistant that recommends professors based on student queries. Using a comprehensive database of professor reviews, you will provide the top 8 professor recommendations that best match the user's request.

Return only a numbered list of the top 8 results, including each professor's:
1. Name
2. Subject area
3. Star rating
4. A good summary of their review
5. Any other crucial information the student should know

Format:
1. [Professor Name] - [Subject Area] - [Star Rating]
   "[Review excerpt]"
   [Crucial information]

2. [Professor Name] - [Subject Area] - [Star Rating]
   "[Review excerpt]"
   [Crucial information]

...

If no results are found, respond only with: "No results found. Please try different search criteria."
Provide abosultely no styling such as bolding, italicizing, or underlining.
`;

function generateStarRating(rating) {
  const filledStar = "⭐";
  const totalStars = 5;

  const roundedRating = Math.round(rating);
  const fullStars = Math.floor(roundedRating);

  const starsDisplay = filledStar.repeat(fullStars);

  return `${starsDisplay} (${rating.toFixed(1)}/5.0 stars)`;
}

export async function POST(req) {
  const data = await req.json();
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index("rag").namespace("ns1");
  const openai = new OpenAI();

  console.log("Data:", data);
  console.log("\n\nData Content:", data.content);

  const text = data.content;
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const results = await index.query({
    topK: 8,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
  });

  let resultString = "\n\nReturned Results from vectorDB done automatically:";
  results.matches.forEach((match) => {
    const stars = generateStarRating(match.metadata.stars);
    let resultSnippet = "";

    if (match.metadata.url) {
      // For RMP Data
      const reviews = JSON.parse(match.metadata.reviews || "[]");
      let allReviews = reviews
        .map(
          (review, idx) => `
        Review ${idx + 1}:
        - Class: ${review.class}
        - Quality: ${review.quality}/5.0
        - Difficulty: ${review.difficulty}/5.0
        - Review: ${review.review}
      `
        )
        .join("\n");

      resultSnippet = `
      Professor: ${match.metadata.professor}
      School: ${match.metadata.school}
      Department: ${match.metadata.department}
      Stars: ${stars}
      All Reviews:
      ${allReviews}
      URL: ${match.metadata.url}
      `;
    } else {
      // For Prepopulated JSON Data
      resultSnippet = `
      Professor: ${match.id}
      Review: ${match.metadata.review}
      Subject: ${match.metadata.subject}
      Stars: ${stars}
      `;
    }

    resultString += `\n${resultSnippet}\n\n`;
  });

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: resultString },
    ],
    model: "gpt-4o-mini",
  });

  //   console.log("\nCompletion:", completion.choices[0].message.content);

  const completionText = completion.choices[0].message.content;

  // Parse the completion text into an array of objects
  const professorList = completionText
    .split("\n\n")
    .filter((item) => item.trim())
    .map((item, index) => {
      const [nameSubjectRating, review, crucialInfo] = item
        .split("\n")
        .map((line) => line.trim());
      const [name, subject, rating] = nameSubjectRating.split(" - ");
      return {
        id: index + 1,
        name: name.replace(/^\d+\.\s*/, ""),
        subject,
        rating,
        review: review.replace(/"/g, ""),
        crucialInfo,
      };
    });

  console.log("\n\nProfessor List:", professorList);

  return new NextResponse(JSON.stringify(professorList), { status: 200 });
}
