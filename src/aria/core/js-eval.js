/**
 * Call eval and enable better debugging support with source URL. There is a bug in firebug which prevents the source
 * code loaded by an eval which comes from code loaded by an eval to be shown properly (with comments and correct
 * indentation). Aria.js is not loaded through an eval, so that there is no problem here.
 * @param {String} srcJS string to be evaluated
 * @param {String} srcURL path to the file containing the string (useful when debugging)
 * @param {Object} evalContext An object to be available from the javascript code being evaluated. The object is named
 * evalContext.
 *
 * Copied implementation from the generated bootstrap file
 */

export const ariaEval = function (srcJS, srcURL, evalContext) {
  const evalResultFunction = jsEval(srcJS, srcURL, "(function(){\n", "\n})");
  return evalResultFunction(srcJS, srcURL, evalContext);
};

function jsEval(jsCode, url, prefix, suffix) {
  try{
    /*exec*/
    return eval$module((prefix || "") + jsCode + (suffix || ""), url);
  } catch (error) {
    /*noderError*/
    throw createEvalError([ jsCode, url, prefix, suffix ], error);
  }
}

function eval$module(code, filepath) {
  var res = {};
  // Using the 'arguments[1].res = ...' trick because IE does not let eval return a function
  if (filepath) {
      code = [ "/*\n * File: ", filepath, "\n */\narguments[1].res=", code, "\n//# sourceURL=", filepath ].join("");
  } else {
      code = "arguments[1].res=" + code;
  }
  callEval(code, res);
  // callEval is defined outside of any closure
  return res.res;
}

// eslint-disable-next-line no-unused-vars
function callEval(code, _result) {
  eval(code);
}

function createEvalError(args, cause) {
  var error = new Error(`Aria JS Eval Error`);
  error.name = "JSEvalError";
  error.args = args;
  error.cause = cause;
  return error;
};



