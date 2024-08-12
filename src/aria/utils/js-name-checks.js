/**
 * List of Js reserved words used to check namespace (some browsers do not accept these words in JSON keys)
 * @type Map
 * @private
 */
const __JS_RESERVED_WORDS = {
  "_abstract": 1,
  "_boolean": 1,
  "_break": 1,
  "_byte": 1,
  "_case": 1,
  "_catch": 1,
  "_char": 1,
  "_class": 1,
  "_const": 1,
  "_continue": 1,
  "_debugger": 1,
  "_default": 1,
  "_delete": 1,
  "_do": 1,
  "_double": 1,
  "_else": 1,
  "_enum": 1,
  "_export": 1,
  "_extends": 1,
  "_false": 1,
  "_final": 1,
  "_finally": 1,
  "_float": 1,
  "_for": 1,
  "_function": 1,
  "_goto": 1,
  "_if": 1,
  "_implements": 1,
  "_import": 1,
  "_in": 1,
  "_instanceof": 1,
  "_int": 1,
  "_interface": 1,
  "_long": 1,
  "_native": 1,
  "_new": 1,
  "_null": 1,
  "_package": 1,
  "_private": 1,
  "_protected": 1,
  "_public": 1,
  "_return": 1,
  "_short": 1,
  "_static": 1,
  "_super": 1,
  "_switch": 1,
  "_synchronized": 1,
  "_this": 1,
  "_throw": 1,
  "_throws": 1,
  "_transient": 1,
  "_true": 1,
  "_try": 1,
  "_typeof": 1,
  "_var": 1,
  "_void": 1,
  "_volatile": 1,
  "_while": 1,
  "_with": 1,
  "_constructor": 1, // Addition to ECMA list
  "_prototype": 1
  // Addition to ECMA list
};

/**
 * Tell if a string is a reserved JavaScript keyword
 * @param {String} str the string to check
 * @return {Boolean} true if s is a javascript reserved keyword
 */
export const isJsReservedWord = function (str) {
  if (__JS_RESERVED_WORDS["_" + str]) {
    return true;
  }
  return false;
};

/**
 * Tell is a string is acceptable as a JavaScript variable name (must not start with some specific chars and must
 * not be a reserved keyword)
 * @param {String} s the string to check
 * @return {Boolean} true if s is a valid variable name
 */
export const checkJsVarName = function (str) {
  if (!str.match(/^[a-zA-Z_$][\w$]*$/)) {
      return false;
  }
  if (isJsReservedWord(str)) {
      return false;
  }
  return true;
};
