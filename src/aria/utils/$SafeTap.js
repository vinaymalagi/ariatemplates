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
import { isTouch } from './Device.js';

const touchDevice = isTouch();
let ariaTouchClickBuster = null;

var registerSafeTap = function (event) {
    if (ariaTouchClickBuster) {
        ariaTouchClickBuster.registerTap(event);
        return true;
    } else {
        return false;
    }
};



async function loadGetRegisterSafeTapDependencies() {
    if (touchDevice) {
        const [clickBuster] = await Promise.all([
            import("../touch/ClickBuster.js"),
            import("../touch/SafeTap.js"),
        ]);
        ariaTouchClickBuster = clickBuster;
    }
}

if (touchDevice) {
    await loadGetRegisterSafeTapDependencies();
}
// getRegisterSafeTap.$preload = function () {
//     if (touchDevice) {
//         return asyncRequire("../touch/ClickBuster", "../touch/SafeTap").spreadSync(function (clickBuster) {
//             ariaTouchClickBuster = clickBuster;
//         });
//     }
// };

export function getRegisterSafeTap() {
  return registerSafeTap;
};

