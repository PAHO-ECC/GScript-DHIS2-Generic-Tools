/**
 * Updates a map in DHIS2, preserving dimension layout and
 * optionally adding:
 *   - A newPeriod to override existing period ["pe"]
 *   - A new set of OU items (newOuItems) to override existing organization unit ["ou"]
 *   - Additional new dimensions for columns, rows, or filters
 *   - If "ou" is blank and no newOuItems are provided, we check the map's
 *     userOrganisationUnit, userOrganisationUnitChildren, userOrganisationUnitGrandChildren
 *     to decide whether to default to "USER_ORGUNIT", "USER_ORGUNIT_CHILDREN",
 *     or "USER_ORGUNIT_GRANDCHILDREN". If none is provided either, a default "USER_ORGUNIT" is provided.
 *
 * @param {string} baseUrl           e.g. "https://dhis.com/prod"
 * @param {string} mapId             Map ID, e.g. "cYtmqeA1hua"
 * @param {string} apitokenGET       DHIS2 API token for GET query. Make sure the token has at minimum 'GET' privileges assigned. Used as a default for PUT and GET if apitokenPUT isn't provided.
 * @param {string} apitokenPUT       Optional DHIS2 API token for PUT query. Make sure the token has at minimum 'PUT' privileges assigned.
 * @param {?string} newPeriod        If provided, override "pe" with that ID, e.g. "2025SunW14"
 * @param {?Array}  newOuItems       If provided, override the entire "ou" dimension with these items, e.g. [ { id: "ImspTQPwCqd" } ]
 * @param {?Object} additionalDims   If provided, an object with optional keys 'columns', 'rows', 'filters'.
 *                                   Each key is an array of dimension objects, e.g.:
 *                                     {
 *                                       columns: [
 *                                         { dimension: "abc123", items: [ { id: "Xyz" }, ... ] },
 *                                         ...
 *                                       ],
 *                                       rows: [...],
 *                                       filters: [...]
 *                                     }
 * 
 * Updates a DHIS2 Map with the given parameters.
 *
 * Usage:
 *   updateDHSI2Map(
 *     "https://play.dhis2.org/dev",   // baseUrl
 *     "Map_12345",                  // mapId
 *     "YOUR_SECRET_GETAPI_TOKEN_HERE",   // apitokenGET
 *     "YOUR_SECRET_PUTAPI_TOKEN_HERE",   // apitokenPUT
 *     ["202101", "202102"],           // newPeriod
 *     ["OU_abcdef", "OU_123456"],     // newOuItems
 *     { dimensionKey: "dimensionValue" } // additionalDims
 *   );
 */

function updateDHIS2Map(
  baseUrl,
  mapId,
  apitokenGET,
  apitokenPUT,
  newPeriod,
  newOuItems,
  additionalDims // { columns: [...], rows: [...], filters: [...] }
) {
    var url = baseUrl + "/api/maps/" + mapId;
    if (apitokenPUT == undefined) {var apitokenPUT = apitokenGET};    //If PUT apitoken isn't assigned, assuming the get apitoken has put privileges.

    // 1) GET the existing chart

    var mapConfig = getData(url,apitokenGET);
    var mapView = mapConfig.mapViews[0];

    // -------------------------------------------------------------------
    // 2) Gather existing dimension data (pe, dx, category, ou)
    // -------------------------------------------------------------------
    // a) Period
    var existingPeriod = null;
    if (Array.isArray(mapView.periods) && mapView.periods.length > 0) {
            existingPeriod = mapView.periods[0].id;
    }

  // b) dx
  var existingDxItems = [];
  if (Array.isArray(mapView.dataDimensionItems)) {
    existingDxItems = mapView.dataDimensionItems
      .map(function(ddi) {
        if (ddi.reportingRate && ddi.reportingRate.dimensionItem) {
          return { id: ddi.reportingRate.dimensionItem };
        } else if (ddi.indicator && ddi.indicator.dimensionItem) {
          return { id: ddi.indicator.dimensionItem };
        } else if (ddi.dataElement && ddi.dataElement.id) {
          return { id: ddi.dataElement.id };
        } else if (ddi.dataElement && ddi.dataElement.dimensionItem) {
          return { id: ddi.dataElement.dimensionItem };
        }
        return null;
      })
      .filter(Boolean);
  }

  // c) Category dimension mapping
  var categoryMap = {};
  if (Array.isArray(mapView.categoryDimensions)) {
    mapView.categoryDimensions.forEach(function(cd) {
      if (cd.category && cd.category.id && Array.isArray(cd.categoryOptions)) {
        categoryMap[cd.category.id] = cd.categoryOptions.map(function(opt) {
          return { id: opt.id };
        });
      }
    });
  }

  // d) If we find an existing OU ID in organisationUnits
  var existingOuId = null;
  if (Array.isArray(mapView.organisationUnits) && mapView.organisationUnits.length > 0) {
    existingOuId = mapView.organisationUnits[0].id;
  }

  // e) Figure out the fallback if OU is blank
  //    We check userOrganisationUnitGrandChildren => userOrganisationUnitChildren => userOrganisationUnit
  function getDefaultUserOu() {
    if (mapView.userOrganisationUnitGrandChildren) {
      return "USER_ORGUNIT_GRANDCHILDREN";
    }
    if (mapView.userOrganisationUnitChildren) {
      return "USER_ORGUNIT_CHILDREN";
    }
    if (mapView.userOrganisationUnit) {
      return "USER_ORGUNIT";
    }
    // If none of them are true, fallback to "USER_ORGUNIT_CHILDREN" or any default you'd like
    return "USER_ORGUNIT";
  }

  // -------------------------------------------------------------------
  // 3) Helper: get dimension items for a given dimension ID
  // -------------------------------------------------------------------
  function getDimensionItems(dimensionId) {
    // If "pe" => newPeriod overrides existingPeriod
    if (dimensionId === "pe") {
      var finalPeriod = newPeriod || existingPeriod;
      return finalPeriod ? [ { id: finalPeriod } ] : [];
    }
    // If "dx"
    if (dimensionId === "dx") {
      return existingDxItems.length ? existingDxItems : [];
    }
    // If "ou" => if newOuItems is provided, use that; else existing ID; else fallback
    if (dimensionId === "ou") {
      if (Array.isArray(newOuItems) && newOuItems.length > 0) {
        return newOuItems;
      }
      if (existingOuId) {
        return [ { id: existingOuId } ];
      }
      return [ { id: getDefaultUserOu() } ];
    }
    // If it's a known category dimension
    if (categoryMap[dimensionId]) {
      return categoryMap[dimensionId];
    }
    // If none of the above
    return [];
  }

  // -------------------------------------------------------------------
  // 4) Rebuild columns, rows, filters using *Dimensions arrays
  // -------------------------------------------------------------------
  function buildDimArr(dimIds) {
    if (!Array.isArray(dimIds)) return [];
    return dimIds.map(function(dimId) {
      return {
        dimension: dimId,
        items: getDimensionItems(dimId)
      };
    });
  }

  var newColumns = buildDimArr(mapView.columnDimensions);
  var newRows    = buildDimArr(mapView.rowDimensions);
  var newFilters = buildDimArr(mapView.filterDimensions);

  // -------------------------------------------------------------------
  // 5) Append any additional dimensions the user wants
  // -------------------------------------------------------------------
  if (additionalDims) {
    // columns
    if (Array.isArray(additionalDims.columns)) {
      newColumns = newColumns.concat(additionalDims.columns);
    }
    // rows
    if (Array.isArray(additionalDims.rows)) {
      newRows = newRows.concat(additionalDims.rows);
    }
    // filters
    if (Array.isArray(additionalDims.filters)) {
      newFilters = newFilters.concat(additionalDims.filters);
    }
  }

  // Assign to mapConfig
  mapView.columns = newColumns;
  mapView.rows    = newRows;
  mapView.filters = newFilters;
  delete mapView.id;
  delete mapView.periods;
  delete mapView.organisationUnits;
  delete mapView.dataDimensionItems;
  delete mapConfig.lastUpdatedBy;

  // -------------------------------------------------------------------
  // 6) PUT the updated chart
  // -------------------------------------------------------------------
  var responsePUT = putData(url, apitokenPUT, mapConfig);
  responsePUT.getResponseCode() == 200? Logger.log(`Map [${mapConfig.name}] updated successfully!`): Logger.log('PUT Query failed');
}