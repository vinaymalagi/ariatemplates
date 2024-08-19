import { log } from './Log.js';

// TODO: ModernAria: Update "type" doc where applicable in this file.

const ARIA_OVERRIDE_LAUNCH_SETTINGS = globalThis.ARIA_LAUNCH_SETTINGS || {};

/**
 * Global object, root of all classpaths. It is defined even when Aria Templates is run in a non-browser environment
 * (for example: Node.js or Rhino).
 * @type Object
 *
 */
export const $global = ARIA_OVERRIDE_LAUNCH_SETTINGS.$global || globalThis;


/**
 * Window object where the framework is loaded. It is defined only when Aria Templates is run in a browser (as
 * opposed to Aria.$global). It has to be equal to window and not to window.window because the two objects are
 * not equal in IE
 * @type Window | undefined
 */
export const $frameworkWindow = ARIA_OVERRIDE_LAUNCH_SETTINGS.$frameworkWindow || ($global.window ? $global : undefined);


/**
 * The properties available throughout the framework.
 */
export const FRAMEWORK_GLOBALS = {
  /**
   * Window object where templates should be displayed and user interaction should be done. This variable can be set
   * directly before loading the framework (through <code>globalThis.ARIA_LAUNCH_SETTINGS = {$window: ...};</code>).
   * However, once the framework is loaded, it must be changed only through <code>aria.utils.AriaWindow.setWindow</code>.
   * @type Window | undefined
   */
  $window: ARIA_OVERRIDE_LAUNCH_SETTINGS.$window || $frameworkWindow,

  /**
   * Debug mode indicator
   *
   * TODO: ModernAria: Add note about how to change similar to framework window.
   * @type Boolean
   */
  debug: ARIA_OVERRIDE_LAUNCH_SETTINGS.debug === true,

  /**
   * List of root templates
   * Items added/removed by aria.templates.TemplatesCtxtManager
   */
  rootTemplates: [],

  /**
   * Whether running in test mode
   */
  testMode: ARIA_OVERRIDE_LAUNCH_SETTINGS.testMode === true,
};

/**
 * When minSizeMode=true, templates and widgets use their minimum size, to help defining correct sizes for $hdim and
 * $vdim.
 * @type Boolean
 */
export const minSizeMode = ARIA_OVERRIDE_LAUNCH_SETTINGS.minSizeMode === true;

console.log(`Import Meta URL: ${import.meta.url}`);

function getRootFolderPath() {
  if (import.meta && import.meta.url) {

    const url = new URL(import.meta.url);

    const pathParts = url.pathname.split('/').filter((part) => part !== '');
    pathParts.pop(); // Remove the JS part
    const ariaStartRegex = /^(ariatemplates\/)?aria(templates)?(\/core?)$/;
    const path = pathParts.join('/').replace(ariaStartRegex, '') + '/';


    return url.origin + '/' + (path === '/' ? '' : path);
  } else if ($frameworkWindow) {
    $frameworkWindow.location.origin + '/';
  }
  return undefined;
}
// MUST_DO: ModernAria: Root folder path Using
export const rootFolderPath = ARIA_OVERRIDE_LAUNCH_SETTINGS.rootFolderPath || getRootFolderPath();





/**
 * If true, profiling is enabled, and profile data is added to Aria.profilingData.
 * @type Boolean
 */
export const enableProfiling = ARIA_OVERRIDE_LAUNCH_SETTINGS.enableProfiling === true;

/**
 * The memCheckMode variable enables or disables the check of the match between creation and destruction of objects,
 * so that there is no memory leak.
 * @type Boolean
 */
export const memCheckMode = ARIA_OVERRIDE_LAUNCH_SETTINGS.enableProfiling === false;

/**
 * The domain variable has to be set only when you explicitly set the value of document.domain. It is needed by
 * classes using iframes (like aria.utils.HashManager) in order to overcome the limitations imposed by IE7 on the
 * access of the iframe contents. It is desirable to set it at the very beginning, even before loading the bootstrap
 * file of the framework.
 * @type String
 */
export const domain = ARIA_OVERRIDE_LAUNCH_SETTINGS.domain || null;

/**
 * Prefix used for all parameters added in objects by the framework for internal requirements
 * @type String
 */
export const FRAMEWORK_PREFIX = ARIA_OVERRIDE_LAUNCH_SETTINGS.FRAMEWORK_PREFIX || "aria:";

/**
 * URL or relative path or absolute path the aria resources location
 * @type String
 *
 * TODO: ModernAria: Figure out resources URL config access and setup
 */
export const FRAMEWORK_RESOURCES = ARIA_OVERRIDE_LAUNCH_SETTINGS.FRAMEWORK_RESOURCES || "aria/resources";

export const ACCEPTED_TYPES = {
  JS : '.js',
  TPL : '.tpl',
  TML : '.tml',
  CSS : '.tpl.css',
  CML : '.cml',
  TXT : '.tpl.txt'
};


/**
 * Default classpath to use to pass as first parameter to Logger methods
 */
const CLASSPATH_FOR_LOGGER = "Aria";

/**
 * Framework logger instance
 * TODO: ModernAria: Figure out a way to bootstrap the root logger instance
 */
export const FRAMEWORK_LOGGER = log;


/**
 * Log a debug message to the logger
 * @param {String} msg the message text
 * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
 * @param {Object} obj An optional object to be inspected in the logged message
 *
 * TODO: ModernAria: Figure out a different way to populate this function. Maybe use a register function or instantiate aria.core.log without classDefinition Call.
 */
export const $logDebug = function (msg, msgArgs, obj, callerClasspath) {
  FRAMEWORK_LOGGER?.debug(callerClasspath || CLASSPATH_FOR_LOGGER, msg, msgArgs, obj);
};

/**
 * Log an info message to the logger
 * @param {String} msg the message text
 * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
 * @param {Object} obj An optional object to be inspected in the logged message
 *
 * TODO: ModernAria: Figure out a different way to populate this function. Maybe use a register function or instantiate aria.core.log without classDefinition Call.
 */
export const $logInfo = function (msg, msgArgs, obj, callerClasspath) {
  FRAMEWORK_LOGGER?.info(callerClasspath || CLASSPATH_FOR_LOGGER, msg, msgArgs, obj);
};

/**
 * Log a warning message to the logger
 * @param {String} msg the message text
 * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
 * @param {Object} obj An optional object to be inspected in the logged message
 */
export const $logWarn = function (msg, msgArgs, obj, callerClasspath) {
  FRAMEWORK_LOGGER?.warn(callerClasspath || CLASSPATH_FOR_LOGGER, msg, msgArgs, obj);
};

/**
 * Log an error message to the logger
 * @param {String} msg the message text
 * @param {Array} msgArgs An array of arguments to be used for string replacement in the message text
 * @param {Object} err The actual JS error object that was created or an object to be inspected in the logged
 * message
 */
export const $logError = function (msg, msgArgs, err, callerClasspath) {
  FRAMEWORK_LOGGER?.warn(callerClasspath || CLASSPATH_FOR_LOGGER, msg, msgArgs, err);
};

export const resolveUrl = function(path) {
  if (/^\w+:\/\/.+/.test(path)) {
    return path;
}
  // MUST_CHECK: ModernAria: DownloadMgr: If resolveUrl of DownloadMgr with urlMap and rootMap setup is needed.
  return rootFolderPath + path;
};

/**
 * Converts a classpath into the corresponding logical path. It replaces '.' by '/' in the classpath. If an
 * extension is provided, it is included in the result, otherwise, the returned path has no extension.
 * @param {String} classpath Classpath to convert.
 * @param {String} extension Extension to add, it is supposed to start with a dot.
 * @param {Boolean} resolve whether to resolve the logical path before returning it - TODO: ModernAria: Resolve should not be needed. Check Again
 */
// eslint-disable-next-line no-unused-vars
export const getLogicalPath = function (classpath, extension, resolve) {
  var parts = classpath.split(".");
  if (parts[0] === "aria") {
      parts[0] = "ariatemplates";
  }
  var res = parts.join("/") + (extension || "");
  // if (resolve) {
  //     var resolved = resolveModulePath(res);
  //     res = resolved || res;
  // }
  return res;
};

let bootstrapResolver;

const bootstrapPromise = new Promise((resolve) => {
  bootstrapResolver = resolve;
});
export function getBootstrapPromise() {
  return bootstrapPromise;
}
export function bootstrapAria() {
  bootstrapResolver();
}
