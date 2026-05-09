import { SEARCH_QUERIES, FIRECRAWL_API_KEY } from "./config";

export interface RawJobResult {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
}

async function firecrawlSearch(query: string): Promise<RawJobResult[]> {
  const response = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      limit: 10,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
      },
    }),
  });

  if (!response.ok) {
    console.error(
      `Firecrawl search failed for "${query.slice(0, 50)}...": ${response.status}`
    );
    return [];
  }

  const data = await response.json();
  const results: RawJobResult[] = [];

  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const md = item.markdown || "";

      // Try to extract job title from the markdown
      const title = extractTitle(md, item.url || "") || item.title || "Unknown Position";
      const company = extractCompany(md, item.url || "") || extractCompanyFromUrl(item.url || "");
      const location = extractLocation(md) || "Remote";

      results.push({
        title: cleanText(title),
        company: cleanText(company),
        location: cleanText(location),
        url: item.url || "",
        description: md.slice(0, 4000),
        source: new URL(item.url || "https://unknown.com").hostname,
      });
    }
  }

  return results;
}

function extractTitle(md: string, url: string): string {
  // Look for H1 headers
  const h1Match = md.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];

  // Look for common job title patterns
  const jobPattern = md.match(
    /(?:Senior\s+)?(?:Staff\s+)?(?:Principal\s+)?(?:AI|LLM|Machine Learning|Software|ML)\s+(?:Engineer|Developer|Scientist|Architect|Researcher)/i
  );
  if (jobPattern) return jobPattern[0];

  // Fall back to URL-based title
  return "";
}

function extractCompany(md: string, url: string): string {
  // Look for "at CompanyName" patterns
  const atMatch = md.match(/at\s+([A-Z][A-Za-z0-9\s&.,-]{2,30})/);
  if (atMatch) return atMatch[1].trim();

  // Look for company name near job title
  const companyMatch = md.match(
    /(?:AI|LLM|Machine Learning|Software)\s+Engineer[^,]*,\s*([A-Z][A-Za-z\s&.,-]{2,30})/i
  );
  if (companyMatch) return companyMatch[1].trim();

  return "";
}

function extractCompanyFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // ashbyhq.com -> Ashby
    if (hostname.includes("ashbyhq")) return "Ashby Hosted";
    if (hostname.includes("lever.co")) {
      const parts = hostname.split(".");
      return parts[0] === "jobs" ? parts[1] : parts[0];
    }
    if (hostname.includes("greenhouse.io")) {
      const parts = hostname.split(".");
      return parts[0] === "boards" ? parts[1] : parts[0];
    }
    if (hostname.includes("workable.com")) {
      const parts = hostname.split(".");
      return parts[0] === "apply" ? parts[1] : parts[0];
    }
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return "Unknown Company";
  }
}

function extractLocation(md: string): string {
  // Look for location patterns
  const patterns = [
    /(?:Location|Office|Based in|Work from)[\s:]+([^\n,]{3,50})/i,
    /([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)\s*(?:Remote|Hybrid|On-site)/i,
    /(Remote(?:\s*-\s*[A-Za-z]+)?)/i,
    /([A-Z][a-z]+(?:,?\s*[A-Z]{2})?)\s*[\n•]/,
  ];

  for (const pattern of patterns) {
    const match = md.match(pattern);
    if (match && match[1]) {
      const loc = match[1].trim();
      if (loc.length > 2 && loc.length < 60 && !loc.includes("#")) {
        return loc;
      }
    }
  }
  return "";
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[|•]/g, "")
    .trim();
}

export async function runAllQueries(): Promise<RawJobResult[]> {
  const allResults: RawJobResult[] = [];
  const seenUrls = new Set<string>();

  for (const q of SEARCH_QUERIES) {
    console.log(`🔍 Running query: ${q.name}`);
    try {
      const results = await firecrawlSearch(q.query);
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`Query failed: ${q.name}`, err);
    }
  }

  console.log(`📊 Found ${allResults.length} unique job listings`);
  return allResults;
}
