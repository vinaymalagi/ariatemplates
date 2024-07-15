// /*
//  * Copyright 2012 Amadeus s.a.s.
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *    http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// var Aria = require("../Aria");
// var ariaCoreJsonTypes = require("../core/JsonTypes");

import {z} from 'zod';

const baseStatementSchema = z.object({
  name: z.string().
      describe("Name of the statement. It can be one of the special types '#ROOT#', '#TEXT#' and '#EXPRESSION#', or the name of the statement, like 'if' or '@aria:TextField'."),
  lineNumber: z.number().int().min(0).
      describe("Line number corresponding to firstCharParamIndex."),
  // parent: z.object().nullable(),
  // content: z.array(statementDef).optional(),
  firstCharContentIndex: z.number().int().min(0).optional().
      describe('Position of the first character which was parsed into the "content" field of the statement, in the prepared template string (with original comments and some spaces removed). It is not a mandatory field, so class generation does not rely on it (or only for error reporting).'),
  lastCharContentIndex: z.number().int().min(0).optional().
      describe('Position of the last character which was parsed into the "content" field of the statement, in the prepared template string (with original comments and some spaces removed). It is not a mandatory field, so class generation does not rely on it (or only for error reporting).'),
  paramBlock: z.string().describe('Statement parameter, with new lines at the begining and end removed.'),
  properties: z.record(z.string(), z.unknown()).optional().
      describe('Statement properties, after being parsed from paramBlock and/or other parameters. This object is filled during template class generation (it is not yet present after only executing the parser). The properties it contains depend on the name of the statement.'),
  firstCharParamIndex: z.number().int().min(0).optional().
      describe('Position of the first character of the statement parameter inside the prepared template string (with original comments and some spaces removed). It is not a mandatory field, so class generation does not rely on it (or only for error reporting).'),
  lastCharParamIndex: z.number().int().min(0).optional().
      describe('Position of the last character of the statement parameter inside the prepared template string (with original comments and some spaces removed). It is not a mandatory field, so class generation does not rely on it (or only for error reporting).')
});

type BaseStatement = z.infer<typeof baseStatementSchema>;
export type Statement = BaseStatement & {
  parent: Statement | null;
  content?: Statement[];
};

export const statementSchema: z.ZodType<Statement> = baseStatementSchema.extend({
  parent: z.lazy(() => statementSchema.nullable().describe('Link to the parent statement, or null if it is the root statement.')),
  content: z.lazy(() => z.array(statementSchema).optional().describe('Content of the statement, as an array of statements. It is undefined if the statement was not used as a container. It is always undefined for types "text " and "dollar ", and always defined for type "root ".'))

});

export type RootStatement = BaseStatement & {
  name: '#ROOT#';
  content: Statement[];
  parent: null;
  source: string;
};
export const rootStatementSchema = baseStatementSchema.extend({
  name: z.literal('#ROOT#').describe('Name of the statement. It is always "#ROOT#" for the root statement.'),
  content: z.array(statementSchema).describe('Content of the root statement, as an array of statements. It is always defined for the root statement.'),
  parent: z.null().describe('Parent element: is null or optional for the root statement.'),
  source: z.string().describe('Processed template source. It differs from the original template passed to parseTemplate, as there is some preprocessing (to remove comments, ...). Positions in the template tree relative to this string, and not the original one.')
});

        //     }
// });
