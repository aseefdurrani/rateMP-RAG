import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
pc.createIndex({
  name: 'rag',
  dimension: 1536,
  metric: 'cosine',
  spec: { cloud: 'aws', region: 'us-east-1' },
});

// Function to scrape RateMyProfessors data
async function scrapeRMPData(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extracting the professor's name
    const firstName = $('div.NameTitle__Name-dowf0z-0 span').first().text().trim();
    const lastName = $('div.NameTitle__LastNameWrapper-dowf0z-2 span').text().trim();
    const professorName = `${firstName} ${lastName}`;

    // Extracting the department
    const department = $('div.NameTitle__Title-dowf0z-1 a.TeacherDepartment__StyledDepartmentLink-fl79e8-0').text().trim();

    const stars = $('div.RatingValue__Numerator-qw8sqy-2').text().trim();
    
    const wouldTakeAgain = $('div.FeedbackItem__FeedbackNumber-uof32n-1').text().trim();
    const difficulty = parseFloat($('div.FeedbackItem__FeedbackNumber-uof32n-1').text().trim());

    const reviews = [];
    $('div.review-text').each((i, el) => {
      reviews.push($(el).text().trim());
    });

    return {
      professor: professorName,
      department: department,
      stars: stars,
      would_take_again: wouldTakeAgain,
      difficulty: difficulty,
      reviews: reviews,
    };
  } catch (error) {
    console.error("Error scraping RateMyProfessors:", error.message);
    throw new Error("Failed to scrape RateMyProfessors data.");
  }
}

// Function to process and insert data into Pinecone
async function processAndInsertData(data) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const processedData = [];
    for (const review of data.reviews) {
      const response = await client.embeddings.create({
        input: review,
        model: 'text-embedding-ada-002',
      });
      const embedding = response.data[0].embedding;
      processedData.push({
        values: embedding,
        id: data.professor,
        metadata: {
          review: review,
          subject: data.subject,
          stars: data.stars,
          would_take_again: data.would_take_again,
          difficulty: data.difficulty,
        },
      });
    }

    const index = pc.Index('rag');
    await index.upsert({
      vectors: processedData,
      namespace: 'ns1',
    });

    return index.describeIndexStats();
  } catch (error) {
    console.error("Error processing or inserting data:", error.message);
    throw new Error("Failed to process and insert data into Pinecone.");
  }
}

// Next.js API route handler
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const scrapedData = await scrapeRMPData(url);
    const indexStats = await processAndInsertData(scrapedData);

    return NextResponse.json(indexStats);
  } catch (error) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
