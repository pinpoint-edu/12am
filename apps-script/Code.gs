/**
 * Serverless HTTP GET router for data aggregation (Google Apps Script).
 * Deploy: Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
 *
 * ?url=<target>            -> raw text body (text/plain)
 * ?url=<target>&b64=1      -> JSON {status, contentType, body(base64)} (binary-safe)
 */
// Domain that runs the API / proxy endpoints (web, media, music...). Also the fallback if the CDN is blocked.
var SITE_URL = "https://twelveam.broshan.com.np";
// Static site is served from jsDelivr: <mirror>/gh/<CDN_REPO>@<CDN_REF>/<ENTRY>  (repo must be PUBLIC)
var CDN_REPO = "pinpoint-edu/12am";
var CDN_REF = "main";
var ENTRY = "index.html";
var MIRRORS = [
  "https://cdn.jsdelivr.net", "https://fastly.jsdelivr.net",
  "https://gcore.jsdelivr.net", "https://testingcf.jsdelivr.net"
];

function doGet(e) {
  var targetUrl = e.parameter.url;
  if (!targetUrl) {
    // No ?url= -> serve the launcher page
    var t = HtmlService.createTemplateFromFile('Launcher');
    t.config = { siteUrl: SITE_URL, cdnRepo: CDN_REPO, cdnRef: CDN_REF, entry: ENTRY, mirrors: MIRRORS };
    return t.evaluate()
      .setTitle('Home')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (!/^https?:\/\//i.test(targetUrl)) {
    return ContentService.createTextOutput("System Error: Only http(s) targets allowed.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  try {
    var response = UrlFetchApp.fetch(targetUrl, { muteHttpExceptions: true, followRedirects: true });
    if (e.parameter.b64) {
      var headers = response.getHeaders();
      var out = {
        status: response.getResponseCode(),
        contentType: headers['Content-Type'] || headers['content-type'] || 'application/octet-stream',
        body: Utilities.base64Encode(response.getContent())
      };
      return ContentService.createTextOutput(JSON.stringify(out))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(response.getContentText())
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Gateway Timeout/Error: " + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
