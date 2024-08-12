/**
 * Empty function. To be used whenever an empty function is needed in order to avoid closures
 * @type Function
 */
export const emptyFn = function () {};

/**
 * Return true. To be used in order to avoid closures
 * @type Function
 */
export const returnTrue = function () {
    return true;
};

/**
 * Return false. To be used in order to avoid closures
 * @type Function
 */
export const returnFalse = function () {
    return false;
};

/**
 * Return null. To be used in order to avoid closures
 * @type Function
 */
export const returnNull = function () {
    return null;
};

/**
 * Return its first argument. To be used in order to avoid closures
 * @type Function
 */
export const returnArg = function (arg) {
    return arg;
};

/**
 * Returns an empty object. To be used in order to avoid closures.
 */
export const returnObject = function () {
    return {};
};

/**
 * Returns an empty array. To be used in order to avoid closures.
 */
export const returnArray = function () {
    return [];
};
