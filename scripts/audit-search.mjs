// Read-only HTTP audit of the deployed build; no browser automation or private data.
const origin=process.argv[2];if(!origin||!/^https?:\/\//.test(origin))throw Error('Usage: node scripts/audit-search.mjs https://your-deployment');
const canonical='https://www.astonishingtouchhealthcare.org';
const sitemap=await fetch(new URL('/sitemap.xml',origin)).then(r=>r.text());
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(!urls.length)throw Error('Sitemap has no URLs');
const results=[];
for(const url of urls){const path=new URL(url).pathname;const response=await fetch(new URL(path,origin));const html=await response.text();const issues=[];
 if(response.status!==200)issues.push('HTTP '+response.status);
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)issues.push('Expected one H1');
 if(!/<title>[^<]+<\/title>/.test(html))issues.push('Missing title');
 if(!/<meta name="description" content="[^"]+"/.test(html))issues.push('Missing description');
 const canonicalTag=html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
 if(!canonicalTag||new URL(canonicalTag[1]).href!==new URL(path,canonical).href)issues.push('Canonical mismatch');
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 for(const s of schemas){try{JSON.parse(s[1])}catch{issues.push('Invalid structured data')}}
 if(path!=='/privacy'&&!schemas.length)issues.push('Missing structured data');
 const previewBlocked=/<meta name="robots" content="[^"]*noindex/.test(html);
 if(!previewBlocked)issues.push('Review noindex missing');
 results.push({path,status:response.status,structuredDataBlocks:schemas.length,reviewNoindex:previewBlocked,issues});
}
const robots=await fetch(new URL('/robots.txt',origin)).then(r=>r.text());
const report={checkedAt:new Date().toISOString(),origin,canonical,scope:'Review build HTTP/initial-HTML structure, not ranking or Core Web Vitals',pages:results.length,failures:results.filter(r=>r.issues.length).length,robotsReviewBlocked:/Disallow: \/(?:\s|$)/.test(robots),results};
console.log(JSON.stringify(report,null,2));if(report.failures||!report.robotsReviewBlocked)process.exitCode=1;
