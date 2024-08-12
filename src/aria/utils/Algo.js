/*
 * Copyright 2016 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Calls a callback 'count' number of times and returns the result of each call in an array.
 * @param {number} count - Number of times to call the callback
 * @param {Function} callback - The callback function to call
 * @param {Object | null} thisArg - The 'this' scope of the callback call
 * @returns
 */
export function times(count, callback, thisArg) {
  var results = [];
  var index = 0;
  while (index < count) {
    results.push(callback.call(thisArg, index, count));
    index++;
  }
  return results;
}
//     }
// });
