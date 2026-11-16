/**
 * Serverless HTTP GET router for data aggregation (Google Apps Script).
 * Deploy: Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
 *
 * ?url=<target>            -> raw text body (text/plain)
 * ?url=<target>&b64=1      -> JSON {status, contentType, body(base64)} (binary-safe)
 */
function doGet(e) {
  var targetUrl = e.parameter.url;
  if (!targetUrl) {
    return ContentService.createTextOutput("System Error: Missing Parameter Vector.")
      .setMimeType(ContentService.MimeType.TEXT);
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
