/*
 * gets geocoder lng, lat and standardized address
 * @param {string} standardized address to parse (ex. "U božích bojovníků 606/3, 130 00 Praha 3, Žižkov"; max. 255 char.)
 * @param {string} return parameter key
 * @param {integer} index of the result if more than one found
 * @return {array} array of the results
 *
 * https://developers.google.com/maps/documentation/geocoding/ (max. 2500 geolocation requests / day; use cache service)
 *
 */
function getGeocoingLngLatStandardAddress(textAddress, returnArrayIndex) {

  // check variable defined and set default if not
  //textAddress = (textAddress || "U božích bojovníků 606/3, 130 00 Praha 3, Žižkov");
  //textAddress = (textAddress || "Čsl. armády 1429/15, 05201 Spišská Nová Ves");
  //textAddress = (textAddress || "Svatováclavská 931, 68601 Uherské Hradiště");
  textAddress = (textAddress || "Slavkov pod Hostýnem 93, 76861 Slavkov pod Hostýnem");
  returnArrayIndex = (returnArrayIndex || 0);

  // standardize lowercase input
  textAddress = textAddress.toLowerCase();
  // get address hash
  var hashPrefix = "ggl";
  var addressHash = Utilities.base64Encode(hashPrefix + textAddress);

  // catch exception
  try {
    // cache handler
    var geoData = null;
    var publicCache = CacheService.getPublicCache();
    //publicCache.remove(addressHash);
    var cacheContent = publicCache.get(addressHash);
    if (cacheContent != null) {
      geoData = cacheContent;
    } else {
      // geocoder request (http://code.google.com/p/google-apps-script-issues/issues/detail?id=363)
      //var newGeo = Maps.newGeocoder().setLanguage("cs");
      //var geoData = JSON.stringify(newGeo.geocode(textAddress));
      // geocoder request
      var baseGeoUrl = "http://maps.googleapis.com/maps/api/geocode/json?address=";
      var fullGeoUrl = baseGeoUrl + encodeURIComponent(textAddress) + "&sensor=false" + "&language=cs";
      var geoData = UrlFetchApp.fetch(fullGeoUrl).getContentText();

      // cache for one day
      publicCache.put(addressHash, geoData, 86400);
    }

    // json parse from string
    var geoData = JSON.parse(geoData);

    // check no result or bad status
    // https://developers.google.com/maps/documentation/geocoding/#StatusCodes
    if (geoData["results"].length == 0 || geoData.status != "OK") {
      return false;
    }

    // parse result
    var geoRes = geoData["results"][0];
    var geoAddComp = geoData["results"][0]["address_components"];

    // set static results
    var resultArray = new Array();
    resultArray["lng"] = geoData["results"][0].geometry.location.lng.toFixed(7);
    resultArray["lat"] = geoData["results"][0].geometry.location.lat.toFixed(7);
    resultArray["formatted_address"] = geoData["results"][0].formatted_address;

    // loop results
    for (var i = 0; i < geoAddComp.length; i++) {
      if (geoAddComp[i].types.length == 0) {
        resultArray["street_number_long"] = geoAddComp[i].short_name;
      } else {
        var curAddComp = geoAddComp[i].types[0];
        resultArray[curAddComp] = geoAddComp[i].short_name;
      }
    }

    // return result array
    return resultArray;

  } catch (e) {
    Logger.log("# ERROR; can not get source url content " + "[ " + e + " ]");
    throw "Can not get source url content";
    return false;
  }
}
