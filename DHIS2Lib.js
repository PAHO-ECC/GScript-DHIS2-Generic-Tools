// ============================================================
//  DHIS2 Google Apps Script Library
//  Provides GET, POST, PUT, PATCH, DELETE helpers for DHIS2 APIs.
//
//  All functions share the same signature pattern:
//    dhis2<Method>(url, apiToken [, payload])
//
//  Payload handling:
//    - If payload is already a valid JSON string it is sent as-is.
//    - Otherwise it is serialised with JSON.stringify before sending.
// ============================================================

/**
 * Returns a valid JSON string from any payload value.
 * If `payload` is already a valid JSON string it is returned unchanged;
 * otherwise JSON.stringify is applied.
 *
 * @param {*} payload
 * @returns {string}
 */
function _toJsonString(payload) {
  if (typeof payload === 'string') {
    try {
      JSON.parse(payload);
      return payload; // already valid JSON
    } catch (e) {
      return JSON.stringify(payload);
    }
  }
  return JSON.stringify(payload);
}

// ────────────────────────────────────────────────────────────
//  GET
// ────────────────────────────────────────────────────────────
/**
 * Sends a GET request to a DHIS2 API endpoint and returns parsed JSON.
 *
 * @param {string} url       Full API URL, e.g. "https://dhis2.example.org/api/dataElements"
 * @param {string} apiToken  DHIS2 personal access token
 * @returns {Object}         Parsed response body
 *
 * @example
 * var data = dhis2Get("https://play.dhis2.org/dev/api/me", "YOUR_TOKEN");
 */
function dhis2Get(url, apiToken) {
  Logger.log('GET  %s', url);

  var options = {
    method: 'get',
    headers: {
      'Authorization': 'ApiToken ' + apiToken
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      'GET request failed. Code: ' + response.getResponseCode() +
      '\nBody: ' + response.getContentText()
    );
  }

  Logger.log('GET response code: %s', response.getResponseCode());
  return JSON.parse(response.getContentText());
}

// ────────────────────────────────────────────────────────────
//  POST
// ────────────────────────────────────────────────────────────
/**
 * Sends a POST request with a JSON payload to a DHIS2 API endpoint.
 *
 * @param {string}       url       Full API URL
 * @param {string}       apiToken  DHIS2 personal access token
 * @param {Object|string} payload  Request body (object or JSON string)
 * @returns {HTTPResponse}
 *
 * @example
 * dhis2Post("https://play.dhis2.org/dev/api/dataElements", "YOUR_TOKEN", { name: "Test" });
 */
function dhis2Post(url, apiToken, payload) {
  Logger.log('POST %s', url);

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'ApiToken ' + apiToken
    },
    payload: _toJsonString(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200 && response.getResponseCode() !== 201) {
    throw new Error(
      'POST request failed. Code: ' + response.getResponseCode() +
      '\nBody: ' + response.getContentText()
    );
  }

  Logger.log('POST response code: %s', response.getResponseCode());
  return response;
}

// ────────────────────────────────────────────────────────────
//  PUT
// ────────────────────────────────────────────────────────────
/**
 * Sends a PUT request with a JSON payload to replace an existing DHIS2 resource.
 *
 * @param {string}       url       Full API URL
 * @param {string}       apiToken  DHIS2 personal access token
 * @param {Object|string} payload  Request body (object or JSON string)
 * @returns {HTTPResponse}
 *
 * @example
 * dhis2Put("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN", updatedObj);
 */
function dhis2Put(url, apiToken, payload) {
  Logger.log('PUT  %s', url);

  var options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': 'ApiToken ' + apiToken
    },
    payload: _toJsonString(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      'PUT request failed. Code: ' + response.getResponseCode() +
      '\nBody: ' + response.getContentText()
    );
  }

  Logger.log('PUT response code: %s', response.getResponseCode());
  return response;
}

// ────────────────────────────────────────────────────────────
//  PATCH
// ────────────────────────────────────────────────────────────
/**
 * Sends a PATCH request with a JSON payload to partially update a DHIS2 resource.
 *
 * @param {string}       url       Full API URL
 * @param {string}       apiToken  DHIS2 personal access token
 * @param {Object|string} payload  Request body (object or JSON string)
 * @returns {HTTPResponse}
 *
 * @example
 * dhis2Patch("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN", { shortName: "Test" });
 */
function dhis2Patch(url, apiToken, payload) {
  Logger.log('PATCH %s', url);

  var options = {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      'Authorization': 'ApiToken ' + apiToken
    },
    payload: _toJsonString(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(
      'PATCH request failed. Code: ' + response.getResponseCode() +
      '\nBody: ' + response.getContentText()
    );
  }

  Logger.log('PATCH response code: %s', response.getResponseCode());
  return response;
}

// ────────────────────────────────────────────────────────────
//  DELETE
// ────────────────────────────────────────────────────────────
/**
 * Sends a DELETE request to remove a DHIS2 resource.
 *
 * @param {string}        url       Full API URL
 * @param {string}        apiToken  DHIS2 personal access token
 * @param {Object|string} [payload] Optional request body (object or JSON string)
 * @returns {HTTPResponse}
 *
 * @example
 * dhis2Delete("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN");
 */
function dhis2Delete(url, apiToken, payload) {
  Logger.log('DELETE %s', url);

  var options = {
    method: 'delete',
    headers: {
      'Authorization': 'ApiToken ' + apiToken
    },
    muteHttpExceptions: true
  };

  if (payload !== undefined && payload !== null) {
    options.contentType = 'application/json';
    options.payload = _toJsonString(payload);
  }

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200 && response.getResponseCode() !== 204) {
    throw new Error(
      'DELETE request failed. Code: ' + response.getResponseCode() +
      '\nBody: ' + response.getContentText()
    );
  }

  Logger.log('DELETE response code: %s', response.getResponseCode());
  return response;
}
