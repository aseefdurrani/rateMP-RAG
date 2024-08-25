import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function ensureIndexExists() {
  const indexName = 'rag';
  const existingIndexesResponse = await pc.listIndexes();

  const existingIndexes = existingIndexesResponse.indexes.map(index => index.name);

  if (!existingIndexes.includes(indexName)) {
    await pc.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: { serverless: true, pod: 'starter' },
    });
  }
}

// Function to check if the URL already exists in Pinecone
async function checkDuplicateUrl(url) {
  const index = pc.index('rag');
  const queryResponse = await index.query({
    topK: 1,
    includeMetadata: true,
    filter: {
      url: { $eq: url },
    },
  });

  return queryResponse.matches && queryResponse.matches.length > 0;
}

// Function to scrape RateMyProfessors data
async function scrapeRMPData(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const firstName = $('div.NameTitle__Name-dowf0z-0 span').first().text().trim();
    const lastName = $('span.NameTitle__LastNameWrapper-dowf0z-2').text().trim();
    const professorName = `${firstName} ${lastName}`;

    const school = $('div.NameTitle__Title-dowf0z-1 a').last().text().trim();
    const department = $('div.NameTitle__Title-dowf0z-1 a.TeacherDepartment__StyledDepartmentLink-fl79e8-0').text().trim();
    const stars = parseFloat($('div.RatingValue__Numerator-qw8sqy-2').text().trim());
    const wouldTakeAgain = $('div.FeedbackItem__FeedbackNumber-uof32n-1').first().text().trim();
    const difficulty = parseFloat($('div.FeedbackItem__FeedbackNumber-uof32n-1').last().text().trim());

    const reviews = [];
    $('ul#ratingsList li').each((i, el) => {
      const reviewText = $(el).find('div.Comments__StyledComments-dzzyvm-0').text().trim();
      let className = $(el).find('div.RatingHeader__StyledClass-sc-1dlkqw1-3').text().trim();
      className = className.split(' ').filter((v, i, a) => a.indexOf(v) === i).join(' ');

      const qualityRating = parseFloat($(el).find('div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2').first().text().trim());
      const difficultyRating = parseFloat($(el).find('div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2').last().text().trim());

      if (reviewText) {
        reviews.push({
          review: reviewText,
          class: className,
          quality: qualityRating,
          difficulty: difficultyRating,
        });
      }
    });

    return {
      professor: professorName,
      school: school,
      department: department,
      stars: stars,
      would_take_again: wouldTakeAgain,
      difficulty: difficulty,
      reviews: reviews,
      url: url, // Add the URL to the scraped data
    };
  } catch (error) {
    throw new Error("Failed to scrape RateMyProfessors data.");
  }
}

// Function to process and insert data into Pinecone
async function processAndInsertData(data) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const embeddings = [];
    for (const review of data.reviews) {
      const response = await client.embeddings.create({
        input: review.review,
        model: 'text-embedding-3-small',
      });
      embeddings.push(response.data[0].embedding);
    }

    const averageEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );

    const professorData = {
      id: data.professor, // A unique identifier for the professor
      values: averageEmbedding, // The averaged embedding representing the professor
      metadata: {
        professor: data.professor,
        school: data.school,
        department: data.department,
        stars: data.stars,
        would_take_again: data.would_take_again,
        overall_difficulty: data.difficulty,
        url: data.url, // Store the URL in metadata
        reviews: JSON.stringify(data.reviews) // Serialize the reviews as a JSON string
      }
    };

    const index = pc.index('rag');
    const upsertResponse = await index.namespace("ns1").upsert([professorData]);

    return professorData.metadata; // Return the metadata so it can be used on the frontend

  } catch (error) {
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

    await ensureIndexExists();

    const isDuplicate = await checkDuplicateUrl(url);
    if (isDuplicate) {
      return NextResponse.json({ error: 'This URL has already been submitted.' }, { status: 400 });
    }

    console.log("Scraping data from URL:", url);
    const scrapedData = await scrapeRMPData(url);
    console.log("Scraped Data:", JSON.stringify(scrapedData, null, 2));

    console.log("Processing and inserting data...");
    const metadata = await processAndInsertData(scrapedData);

    return NextResponse.json({ success: true, metadata }); // Send the metadata back to the frontend
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
