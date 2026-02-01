import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// Initialize Cerebras client (OpenAI compatible)
const cerebras = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: CEREBRAS_API_KEY,
});

// Upload image to imgbb and get public URL
async function uploadToImgbb(fileBuffer) {
  const base64Image = fileBuffer.toString('base64');

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    new URLSearchParams({ image: base64Image }),
    { timeout: 30000 }
  );

  return response.data.data.url;
}

// Search image using SerpApi Google Lens with retry
async function searchWithSerpApi(imageUrl, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_lens',
          url: imageUrl,
          api_key: SERPAPI_KEY,
          no_cache: true,
        },
        timeout: 60000,
      });

      // Check if SerpApi returned an error in the response
      if (response.data.error) {
        throw new Error(`SerpApi error: ${response.data.error}`);
      }

      // Return data with retry count (0-indexed, so attempt-1 gives retries done)
      return { data: response.data, retries: attempt - 1 };
    } catch (error) {
      console.log(`[2/3] SerpApi attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt === retries) {
        throw error;
      }

      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Build the analysis prompt for LLM
function buildAnalysisPrompt(visualMatches, totalResults, serpApiData) {
  const top10 = visualMatches.slice(0, 10);

  let matchesText = top10.map((match, i) => `Match ${i + 1}:
  Title: ${match.title || 'Unknown'}
  Source: ${match.source || 'Unknown'}
  URL: ${match.link || 'N/A'}
  Price: ${match.price?.value || 'N/A'}`).join('\n\n');

  // Extract additional context from SerpAPI response
  const textExtracted = serpApiData.text_results?.[0]?.text || 'None';
  const bestGuess = serpApiData.knowledge_graph?.[0]?.title || 'None';
  const categories = serpApiData.knowledge_graph?.[0]?.subtitle || 'None';

  return `You are an expert art historian acting as a JSON API. Your task is to analyze image search results from Google Lens to identify the artist and artwork, then output the results strictly as a valid JSON object.

### INSTRUCTIONS:

1.  **Analyze the Visual Matches:** Carefully review the provided matches (titles, sources, URLs, prices) and additional context below.
2.  **Identify Artist & Artwork:**
    * Look for consistency across sources.
    * Prioritize reputable galleries or museums over generic marketplaces.
    * If you cannot identify the artist with >30% confidence, set the name to null.
3.  **Perform Analysis (for JSON output):**
    * Determine the style, medium, and period.
    * Identify notable characteristics.
    * Summarize why you assigned your specific confidence score (mentioning match consistency or lack thereof).

### INPUT DATA:

${matchesText}

Additional Context:
- Total matches found: ${totalResults}
- Text extracted: ${textExtracted}
- Best guess: ${bestGuess}
- Categories: ${categories}

### OUTPUT FORMAT:

Return ONLY a single valid JSON object. Do not include markdown formatting (like \`\`\`json), introduction text, or explanations outside the JSON.

Use this specific schema:
{
  "identification": {
    "artist_name": "Name or null",
    "artist_confidence_score": 0-100,
    "artwork_title": "Title or null",
    "artwork_confidence_score": 0-100
  },
  "analysis": {
    "style_and_medium": "Brief description of style, medium, and period",
    "visual_characteristics": "Notable themes or details visible in the matches"
  }
}`;
}

// Parse LLM response to extract structured data
function parseAnalysisResponse(content) {
  let structuredData = null;

  // Try parsing as raw JSON first (new format expects no markdown)
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
      structuredData = JSON.parse(trimmed);
    }
  } catch (e) {
    // Fall back to extracting from markdown code block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.error('Failed to parse JSON from LLM response:', e2);
      }
    }
  }

  // Flatten the nested structure for backward compatibility
  const defaultData = {
    artist_name: null,
    artist_confidence_score: 0,
    artwork_title: null,
    artwork_confidence_score: 0,
    style_and_medium: null,
    reasoning_summary: null,
    visual_characteristics: null,
  };

  if (structuredData) {
    return {
      markdown: content,
      structured: {
        artist_name: structuredData.identification?.artist_name ?? null,
        artist_confidence_score: structuredData.identification?.artist_confidence_score ?? 0,
        artwork_title: structuredData.identification?.artwork_title ?? null,
        artwork_confidence_score: structuredData.identification?.artwork_confidence_score ?? 0,
        style_and_medium: structuredData.analysis?.style_and_medium ?? null,
        reasoning_summary: structuredData.analysis?.reasoning_summary ?? null,
        visual_characteristics: structuredData.analysis?.visual_characteristics ?? null,
      },
    };
  }

  return {
    markdown: content,
    structured: defaultData,
  };
}

// Analyze results with Cerebras LLM
async function analyzeWithLLM(visualMatches, totalResults, serpApiData) {
  const promptStart = Date.now();
  const prompt = buildAnalysisPrompt(visualMatches, totalResults, serpApiData);
  const promptBuildTime = Date.now() - promptStart;

  // Approximate token count (rough: 1 token ≈ 4 chars)
  const approxInputTokens = Math.round(prompt.length / 4);
  console.log(`  [LLM] Prompt: ${prompt.length} chars (~${approxInputTokens} tokens), built in ${promptBuildTime}ms`);

  const apiStart = Date.now();
  const response = await cerebras.chat.completions.create({
    model: 'gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 32768,
    temperature: 1,
    top_p: 1,
    reasoning_effort: 'low',
  });
  const apiTime = Date.now() - apiStart;

  const responseContent = response.choices[0].message.content;
  const approxOutputTokens = Math.round(responseContent.length / 4);

  // Log usage if available
  const usage = response.usage || {};
  console.log(`  [LLM] API call: ${apiTime}ms`);
  console.log(`  [LLM] Response: ${responseContent.length} chars (~${approxOutputTokens} tokens)`);
  if (usage.prompt_tokens) {
    console.log(`  [LLM] Actual tokens - input: ${usage.prompt_tokens}, output: ${usage.completion_tokens}, total: ${usage.total_tokens}`);
  }

  return parseAnalysisResponse(responseContent);
}

// Main search endpoint
app.post('/api/search', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const totalStart = Date.now();
    console.log('\n========== NEW REQUEST ==========');
    console.log(`File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);

    // Step 1: Upload to imgbb
    const uploadStart = Date.now();
    console.log('[1/3] Uploading to imgbb...');
    const imageUrl = await uploadToImgbb(req.file.buffer);
    const uploadTime = Date.now() - uploadStart;
    console.log(`[1/3] imgbb upload: ${uploadTime}ms - ${imageUrl}`);

    // Step 2: Search with SerpApi
    const searchStart = Date.now();
    console.log('[2/3] Searching with SerpApi...');
    const { data: serpApiResults, retries: searchRetries } = await searchWithSerpApi(imageUrl);
    const searchTime = Date.now() - searchStart;
    const visualMatches = serpApiResults.visual_matches || [];
    console.log(`[2/3] SerpApi search: ${searchTime}ms - ${visualMatches.length} results (retries: ${searchRetries})`);

    // Step 3: Analyze with LLM
    const analysisStart = Date.now();
    console.log('[3/3] Analyzing with Cerebras LLM...');
    const analysis = await analyzeWithLLM(visualMatches, visualMatches.length, serpApiResults);
    const analysisTime = Date.now() - analysisStart;
    console.log(`[3/3] LLM analysis: ${analysisTime}ms`);

    const totalTime = Date.now() - totalStart;
    console.log('----------------------------------');
    console.log(`TOTAL: ${totalTime}ms (upload: ${uploadTime}ms + search: ${searchTime}ms + analysis: ${analysisTime}ms)`);
    console.log('==================================\n');

    res.json({
      success: true,
      imageUrl,
      timing: {
        total: `${totalTime}ms`,
        upload: `${uploadTime}ms`,
        search: `${searchTime}ms`,
        searchRetries,
        analysis: `${analysisTime}ms`,
      },
      analysis: {
        ...analysis.structured,
        markdown: analysis.markdown,
      },
      results: {
        organic: visualMatches.map((item, index) => ({
          position: item.position || index + 1,
          title: item.title,
          url: item.link,
          source: item.source,
          thumbnail: item.thumbnail,
          price: item.price?.value,
        })),
        exactMatch: [],
        totalResults: visualMatches.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Search failed',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
