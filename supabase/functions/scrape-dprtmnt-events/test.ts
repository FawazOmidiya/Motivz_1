// Test script for the DPRTMNTS scraper
// Run with: deno run --allow-net test.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BASE_URL = "https://dprtmnt.com";
const EVENTS_URL = `${BASE_URL}/events/`;

async function testScraper() {
  try {
    console.log("Testing DPRTMNTS scraper...");

    const response = await fetch(EVENTS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MotivzBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched ${html.length} characters`);

    // Test the parsing logic
    const headerRegex = /<h[12][^>]*>([^<]+)<\/h[12]>/gi;
    let match;
    const events: string[] = [];

    while ((match = headerRegex.exec(html)) !== null) {
      const name = match[1].trim();
      if (
        name &&
        !name.toUpperCase().includes("UPCOMING EVENTS") &&
        !name.toUpperCase().includes("VIEW ALL EVENTS")
      ) {
        events.push(name);
      }
    }

    console.log(`Found ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event}`);
    });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

if (import.meta.main) {
  await testScraper();
}
