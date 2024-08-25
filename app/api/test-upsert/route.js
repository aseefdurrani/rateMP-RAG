import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY, // Use your Pinecone API key from environment variables
});

export async function POST(req) {
  try {
    // Ensure the index is defined
    const index = pc.index("rag");
    
    // Example professor object with multiple reviews, serialized as a JSON string
    const professorData = {
      id: "professor-a", // A unique identifier for the professor
      values: new Array(1536).fill(0.1), // Example vector representing the professor
      metadata: {
        professor: "Professor A",
        department: "Computer Science",
        stars: 4.5,
        would_take_again: "80%",
        overall_difficulty: 3.5,
        reviews: JSON.stringify([
          {
            review: "This is the first review for Class101.",
            class: "Class101",
            quality: 4,
            difficulty: 3
          },
          {
            review: "This is the second review for Class102.",
            class: "Class102",
            quality: 5,
            difficulty: 4
          },
          {
            review: "This is the third review for Class103.",
            class: "Class103",
            quality: 3,
            difficulty: 5
          }
        ])
      }
    };

    // Upsert the professor object with multiple reviews into Pinecone
    const upsertResponse = await index.namespace("ns1").upsert([professorData]);

    // Return the response using NextResponse
    return NextResponse.json({ success: true, upsertResponse });

  } catch (error) {
    console.error("Error processing or inserting data into Pinecone:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
