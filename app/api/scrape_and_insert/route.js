import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
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
  spec: { serverless: true, pod: 'starter' },
});

// Function to scrape RateMyProfessors data
async function scrapeRMPData(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extracting the professor's name
    const firstName = $('div.NameTitle__Name-dowf0z-0 span').first().text().trim();
    const lastName = $('span.NameTitle__LastNameWrapper-dowf0z-2').text().trim(); // Adjusted to properly select the last name
    const professorName = `${firstName} ${lastName}`;

    // Extracting the department
    const department = $('div.NameTitle__Title-dowf0z-1 a.TeacherDepartment__StyledDepartmentLink-fl79e8-0').text().trim();

    // Extracting the star rating
    const stars = parseFloat($('div.RatingValue__Numerator-qw8sqy-2').text().trim());

    // Extracting 'Would Take Again' percentage
    const wouldTakeAgain = $('div.FeedbackItem__FeedbackNumber-uof32n-1').first().text().trim();

    // Extracting 'Level of Difficulty'
    const difficulty = parseFloat($('div.FeedbackItem__FeedbackNumber-uof32n-1').last().text().trim());

    // Extracting reviews, class, quality, and difficulty ratings for each review
    const reviews = [];
    $('ul#ratingsList li').each((i, el) => {
      const reviewText = $(el).find('div.Comments__StyledComments-dzzyvm-0').text().trim();
      let className = $(el).find('div.RatingHeader__StyledClass-sc-1dlkqw1-3').text().trim();
      
      // Ensure class name isn't duplicated
      className = className.split(' ').filter((v, i, a) => a.indexOf(v) === i).join(' ');

      const qualityRating = parseFloat($(el).find('div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2').first().text().trim());
      const difficultyRating = parseFloat($(el).find('div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2').last().text().trim());

      // Filter out empty reviews
      if (reviewText) {
        reviews.push({
          review: reviewText,
          class: className,
          quality: qualityRating,
          difficulty: difficultyRating,
        });
      }
    });

    const scrapedData = {
      professor: professorName,
      department: department,
      stars: stars,
      would_take_again: wouldTakeAgain,
      difficulty: difficulty,
      reviews: reviews,
    };

    console.log("Scraped Data:", scrapedData); // Print the scraped data to the console for debugging

    return scrapedData;

  } catch (error) {
    console.error("Error scraping RateMyProfessors:", error.message);
    throw new Error("Failed to scrape RateMyProfessors data.");
  }
}

// Function to process and insert data into Pinecone
// Function to process and insert data into Pinecone
async function processAndInsertData(data) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const processedData = [];
  
      // Iterate over each review in the data object
      for (const review of data.reviews) {
        const response = await client.embeddings.create({
          input: review.review,
          model: 'text-embedding-3-small',
        });
  
        const embedding = response.data[0].embedding;
  
        // Append the processed review data to the processedData array
        processedData.push({
          id: `${data.professor}-${review.class}-${Math.random().toString(36).substring(2, 15)}`, // Keep the unique ID
          values: embedding,
          metadata: {
            review: review.review,
            class: review.class,
            quality: review.quality,
            difficulty: review.difficulty,
            department: data.department,
            stars: data.stars,
            would_take_again: data.would_take_again,
            overall_difficulty: data.difficulty,
            professor: data.professor // Adding professor name to metadata
          },
        });
      }
  
      // Log the processed data to ensure it's structured correctly
      console.log("Processed Data:", processedData);
  
      // Ensure processedData is an array and contains at least one element
      if (Array.isArray(processedData) && processedData.length > 0) {
        // Now, upsert the data into Pinecone
        const index = pc.Index('rag');
        await index.upsert({
          vectors: processedData,
          namespace: 'ns1',
        });
  
        return index.describeIndexStats();
      } else {
        throw new Error("Processed data is not in the correct format or is empty.");
      }
    } catch (error) {
      console.error("Error processing or inserting data:", error);
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

    console.log("Scraping data from URL:", url);
    const scrapedData = await scrapeRMPData(url);
    console.log("Scraped Data:", JSON.stringify(scrapedData, null, 2));

    console.log("Processing and inserting data...");
    const indexStats = await processAndInsertData(scrapedData);
    console.log("Index Stats:", JSON.stringify(indexStats, null, 2));

    return NextResponse.json(indexStats);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}