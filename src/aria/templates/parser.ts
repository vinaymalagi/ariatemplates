/*
 * Copyright 2012 Amadeus s.a.s.
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
// var Aria = require("../Aria");
// var ariaUtilsString = require("../utils/String");

import { indexOfNotEscaped, isEscaped, nextWhiteSpace } from "../utils/String.js";
import { ClassGeneratorCfg } from "./CfgBeans.js";
import { Statement, RootStatement } from "./tree-beans.js";

type ParserError = Error & { errors: {msgId: string, msgArgs: unknown[] | null, errorContext: unknown}[] };
/**
 * Template parser: builds a tree of type aria.templates.TreeBeans.Root from a template string.
 */
export abstract class Parser {
  static MISSING_CLOSINGBRACES =
    "line %1: Template parsing error: could not find corresponding '}'.";
  static EXPECTING_OTHER_CLOSING_STATEMENT =
    "line %4: Template parsing error: found closing statement '%2', but '%1' (line %3) should be closed first.";
  static INVALID_STATEMENT_NAME =
    "line %2: Template parsing error: invalid statement name: '%1'";
  static STATEMENT_CLOSED_NOT_OPEN =
    "line %2: Template parsing error: could not find corresponding open statement for closing statement '%1'.";
  static MISSING_CLOSING_STATEMENT =
    "line %2: Template parsing error: statement '%1' was open but never closed.";

  /**
   * Content of the template to be parsed.
   * @type String
   */
  protected template: string | null = null;

  /**
   * Template parsing context. This is used to log errors.
   */
  protected context: unknown = null;

  /**
   * Map a character position from template to a line number.
   * @type Array
   */
  protected __lineNumbers: number[] = [];

  /**
   * Index of the current line being parsed
   */
  protected __currentLn: number = 0;

  /**
   * If true, parser will preserve whitespaces
   * @type Boolean
   */
  protected _keepWhiteSpace = false;

  protected statements: unknown[] = [];

  constructor() {
    // this.context = context;
    // this.template = template;
    // this._keepWhiteSpace = keepWhiteSpace;
    // this.statements = statements;
    // this._prepare(template, false);
    // // this._computeLineNumbers();
  }

  /**
   * Parse the given template and return a tree representing the template.
   * @param {String} template template to parse
   * @param {object} context template context data, passes additional information the to error log)
   * @param {Object} statements list of statements allowed by the class generator
   * @param {Boolean} throwErrors if true, errors will be thrown instead of being logged
   * @return {aria.templates.TreeBeans:Root} The tree built from the template, or null if an error occured. After
   * the execution of this method, this.template contains the template with comments and some spaces and removed,
   * and this.positionToLineNumber can be used to transform positions in this.template into line numbers.
   *
   * TODO:ModernAria: Resolve unknown
   */
  public abstract parseTemplate(template: string, context: ClassGeneratorCfg, statements: string[], throwErrors: boolean): RootStatement | null;

  /**
   * Transform the given template and set this.template and this.__lineNumbers for the given template
   * @param {String} template the template to transform After the execution of this method: this._template:
   * contains the modified template; modifications include removing comments, and spaces at the begining and end
   * of each line this.__lineNumbers: contains an array such that this.__lineNumbers[i] contains the position of
   * the \n character for the line #i
   * @param {Boolean} throwErrors if true, errors will be thrown instead of being logged
   * @protected
   */
  protected _prepare(template: string, throwErrors: boolean): void {
    // normalize line breaks
    template = template.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // remove commented lines containing CDATA
    template = template.replace(/\/\/.*\{(\/)?CDATA\}.*$/gm, "");

    const cdataSplit = template.split("{CDATA}");
    let parts = [],
      cdataParts;
    parts.push(cdataSplit[0]);
    for (let index = 1, l = cdataSplit.length; index < l; index++) {
      cdataParts = cdataSplit[index].split("{/CDATA}");
      if (cdataParts.length != 2) {
        this.logOrThrowError(Parser.MISSING_CLOSING_STATEMENT, ["CDATA"], this.context, throwErrors);
        this.template = template;
        return;
      }
      parts = parts.concat(cdataParts);
    }

    // one on two is outside cdata -> remove comments and spaces
    for (
      let index2 = 0, l = parts.length, tplFragment, match;
      index2 < l;
      index2++
    ) {
      tplFragment = parts[index2];
      if (index2 % 2 === 0) {
        // Replace multi line comments with empty lines
        const multiLineCommentRegEx = /\/\*(.|\n|\r)*?\*\//m;
        match = tplFragment.match(multiLineCommentRegEx);
        while (match) {
          match = match + "";
          let newLines = "";
          let newLineIdx = -1;
          while ((newLineIdx = match.indexOf("\n", newLineIdx + 1)) != -1) {
            newLines += "\n";
          }
          tplFragment = tplFragment.replace(multiLineCommentRegEx, newLines);
        }

        // remove one line comments. First remove whole line comments...
        tplFragment = tplFragment.replace(/^\/\/.*$/gm, "");
        // ... then make sure they are not quoted and not directly preceded by colon
        // to avoid misinterpretation of links.
        // For quotes, do a positive lookahead to see that we have
        // an even number of double quotes on the rest of the line
        tplFragment = tplFragment.replace(
          /([\s;}>{,(])\/\/(?=(?:(?:[^"]*"){2})*[^"]*$).*$/gm,
          "$1"
        );

        if (!this._keepWhiteSpace) {
          tplFragment = tplFragment.replace(/^[ \t]+/gm, ""); // remove spaces at the begining of each
          // line
          tplFragment = tplFragment.replace(/[ \t]+$/gm, ""); // remove spaces at the end of each line
        }
      } else {
        tplFragment = "{CDATA}" + tplFragment + "{/CDATA}";
      }
      parts[index2] = tplFragment;
    }

    template = parts.join("");
    this.template = template;
  }

  /**
   * Create an array with the indexes of all new line characters inside this.template, and store it in the object
   * so that it is possible to use positionToLineNumber after that.
   */
  protected _computeLineNumbers() {
    const template = this.template;
    this.__lineNumbers = [0];
    if (template !== null) {
      let index = template.indexOf("\n");
      while (index != -1) {
        this.__lineNumbers.push(index);
        index = template.indexOf("\n", index + 1);
      }
    }
  }

  /**
   * Transform a character position in this.template into a line number.
   * @param {Integer} pos position in this.template
   * @return {Integer} The corresponding line number
   */
  public positionToLineNumber(pos: number) {
    // Perf: assume always forward, double loop
    const lineNumbers = this.__lineNumbers;
    const l = lineNumbers.length;
    let i;
    for (i = this.__currentLn; i < l; i++) {
      if (pos < lineNumbers[i]) {
        if (i > 0 && lineNumbers[i - 1] > pos) {
          // previous assumption was wrong
          break;
        }
        this.__currentLn = i;
        return i;
      }
    }
    for (i = 0; i < this.__currentLn; i++) {
      if (pos < lineNumbers[i]) {
        this.__currentLn = i;
        return i;
      }
    }
    return this.__lineNumbers.length;
  }

  /**
   * Find closing braces following start in str, respecting nested blocks and escaped characters.
   * @param {String} str
   * @param {Integer} start
   * @return {Object} a structure containing the indexes of the next unescaped '}' and '{': { indexClose: index of
   * next closing brace or -1 if not enough closing braces were found to close all nested blocks and this block
   * indexOpen: index of the next opening brace following indexClose or -1 if no opening braces was found;
   * meaningless if indexClose == -1 } If indexClose != -1 && indexOpen != -1 then we always have: indexClose &lt;
   * indexOpen
   * @private
   */
  protected __findClosingBraces(
    str: string,
    start: number
  ): { indexClose: number; indexOpen: number } {
    let cursorPos = start;
    let nbrOfBlockOpened = 0,
      nextBlockBegin = -1,
      nextBlockEnd = -1;
    do {
      if (nextBlockBegin < cursorPos) {
        nextBlockBegin = indexOfNotEscaped(str, "{", cursorPos);
      }
      if (nextBlockEnd < cursorPos) {
        nextBlockEnd = indexOfNotEscaped(str, "}", cursorPos);
      }
      if (nextBlockBegin > -1 && nextBlockBegin < nextBlockEnd) {
        nbrOfBlockOpened++;
        cursorPos = nextBlockBegin + 1;
      } else if (nextBlockEnd > -1) {
        nbrOfBlockOpened--;
        cursorPos = nextBlockEnd + 1;
      }
    } while (nbrOfBlockOpened >= 0 && nextBlockEnd > -1);
    // at this state, there is an error if nbrOfBlockOpened >= 0; but, as a consequence we also have
    // nextBlockEnd==-1,
    // (because we are out of the previous while condition)
    // Nothing special to do to report the error, as indexClose==-1 is the way this function returns errors
    // TODO:ModernAria: Implement assertions
    // this.$assert(163, nextBlockEnd == -1
    //         || (nbrOfBlockOpened < 0 && (nextBlockEnd < nextBlockBegin || nextBlockBegin == -1)));
    return {
      indexClose: nextBlockEnd,
      indexOpen: nextBlockBegin,
    };
  }

  /**
   * @param {String} tpl template
   * @param {Integer} start
   * @param {Integer} end
   * @return {String} tpl.substring(start,end) with escaped characters replaced by their value. Also remove new
   * lines at the begining and the end of the param
   * @private
   */
  protected __unescapeParam(tpl: string, start: number, end: number) {
    let res = tpl.substring(start, end);
    res = res.replace(/^[\r\n]+/, ""); // remove new lines at the begining and
    res = res.replace(/[\r\n]+$/, ""); // the end of the param
    // find each \ character followed by $ { } / \ * and suppress the first \ character
    res = res.replace(/\\([/{}$\\*])/g, "$1");
    return res;
  }

  /**
   * @param {String} tpl template
   * @param {Integer} start
   * @param {Integer} end
   * @return {String} tpl.substring(start,end) with escaped characters replaced by their value or "" if this
   * string contains only new lines
   * @private
   */
  protected __unescapeText(tpl: string, start: number, end: number) {
    let res = tpl.substring(start, end);
    if (/^[\r\n]*$/.test(res)) {
      return ""; // the text contains only new lines, remove it
    }
    // don't remove new lines
    // find each \ character followed by $ { } / \ * and suppress the first \ character
    res = res.replace(/\\([/{}$\\*])/g, "$1");
    return res;
  }

  protected logOrThrowError(msgId: string, msgArgs: unknown[] | null, errorContext: unknown, throwErrors: boolean) {
    if (throwErrors) {
      const error = new Error() as ParserError;
      error.errors = [{
                  msgId : msgId,
                  msgArgs : msgArgs,
                  errorContext : errorContext
              }];
      throw error;
    } else {
      console.error(msgId, msgArgs, errorContext);
      // this.$logError(msgId, msgArgs, errorContext);
    }
  }

  /**
   * Log the given error.
   * @param {Integer} charIndex Position in this.template to locate the error. Will be transformed into a line
   * number and added at the end of otherParams
   * @param {String} msgId error id, used to find the error message
   * @param {Array} otherParams parameters of the error message
   * @param {Boolean} throwErrors if true, errors will be thrown instead of being logged
   * @private
   */
  protected __logError(charIndex: number, msgId: string, otherParams: unknown[] | null, throwErrors: boolean) {
    if (!otherParams) {
      otherParams = [];
    }
    otherParams.push(this.positionToLineNumber(charIndex));
    this.logOrThrowError(msgId, otherParams, this.context, throwErrors);
    return;
  }

  /**
   * Use this.template to build a tree At this step no external information is used (list of accepted
   * statements,...)
   * @param {Boolean} throwErrors if true, errors will be thrown instead of being logged
   * @return {Object} the tree built
   * @protected
   */
  protected _buildTree(throwErrors: boolean): RootStatement | null {
    this.__currentLn = 0;
    const tpl = this.template || '';
    let begin = 0; // start of the current block
    let end = 0; // end of the current block
    let index = indexOfNotEscaped(tpl, "{"); // next index of { or }
    let dollar = false;
    let curStatement: Statement;
    let curContainer: Statement[] = [];
    const res: RootStatement = {
      name: "#ROOT#",
      paramBlock: "",
      parent: null,
      content: curContainer,
      lineNumber: 0,
      source: tpl
    };
    const stack: Statement[] = [res]; // stack of content containers
    while (index != -1) {
      dollar = tpl.charAt(index - 1) == "$" && !isEscaped(tpl, index - 1);
      end = dollar ? index - 1 : index;
      if (end - begin > 0) {
        curStatement = {
          name: "#TEXT#",
          parent: stack[stack.length - 1],
          firstCharParamIndex: begin,
          lastCharParamIndex: end,
          paramBlock: this.__unescapeText(tpl, begin, end),
          lineNumber: this.positionToLineNumber(begin),
        };
        if (curStatement.paramBlock.length > 0) {
          curContainer.push(curStatement);
        }
      }
      // read what is between { and }
      begin = index + 1;
      const info = this.__findClosingBraces(tpl, begin);
      end = info.indexClose;
      index = info.indexOpen;
      if (end == -1) {
        this.__logError(begin, Parser.MISSING_CLOSINGBRACES, null, throwErrors);
        return null;
      }
      if (dollar) {
        curContainer.push({
          name: "#EXPRESSION#",
          parent: stack[stack.length - 1],
          firstCharParamIndex: begin,
          lastCharParamIndex: end,
          paramBlock: this.__unescapeParam(tpl, begin, end),
          lineNumber: this.positionToLineNumber(begin),
        });
        begin = end + 1;
      } else {
        if (tpl.charAt(begin) == "/") {
          // this is a closing statement
          begin++;
          // check that the lastly opened statement has the same name
          const closingStatement = tpl.substring(begin, end);

          curStatement = stack.pop() as Statement; //TODO:ModernAria:Check logic assumes stack will always have a value at this point

          if (stack.length === 0) {
            // the stack should always contain at least #ROOT#
            this.__logError(begin, Parser.STATEMENT_CLOSED_NOT_OPEN, [closingStatement],throwErrors);
            return null;
          } else if (curStatement.name != closingStatement) {
            // look into the stack to see if there was a corresponding open statement
            // to give the appropriate error message
            for (let i = stack.length - 1; i >= 1; i--) {
              if (stack[i].name == closingStatement) {
                this.__logError(begin, Parser.EXPECTING_OTHER_CLOSING_STATEMENT,[curStatement.name, closingStatement, curStatement.lineNumber],throwErrors);
                return null;
              }
            }
            this.__logError(begin,Parser.STATEMENT_CLOSED_NOT_OPEN,[closingStatement],throwErrors);
            return null;
          }
          curStatement.lastCharContentIndex = begin - 2; // end of the content just before the {
          // TODO: ModernAria: Check logic assumes content will be an Array
          curContainer = stack[stack.length - 1].content as Statement[]; // return to the previous container from the
          // stack
          begin = end + 1;
        } else {
            const nextBegin = end + 1;
            const singleStatement = tpl.charAt(end - 1) == "/" && isEscaped(tpl, end - 1);
            let statementName: string;
            let firstCharParamIndex: number;

          // adjust end index for singleStatement (remove one char for the /)
          if (singleStatement) {
            end--;
          }


          curStatement = {
            parent: stack[stack.length - 1],
            lastCharParamIndex: end,
          } as Statement; // TODO:ModernAria:Check fix for type coercion, the required fields get added later.
          curContainer.push(curStatement);

          firstCharParamIndex = nextWhiteSpace(tpl,begin,end,/[\s{]/);
          if (firstCharParamIndex == -1) {
            firstCharParamIndex = end; // empty parameter
            statementName = tpl.substring(begin, end);
          } else {
            statementName = tpl.substring(begin, firstCharParamIndex);
            if (tpl.charAt(firstCharParamIndex) != "{") {
              firstCharParamIndex++;
            }
          }
          curStatement.firstCharParamIndex = firstCharParamIndex;
          curStatement.lineNumber =
            this.positionToLineNumber(firstCharParamIndex);

          if (statementName != "CDATA") {
            curStatement.name = statementName;

            if (!singleStatement) {
              // this is an opening statement
              curStatement.content = [];
              curStatement.firstCharContentIndex = nextBegin;
              stack.push(curStatement);
              curContainer = curStatement.content;
            }

            if (!/^[_\w@:]+$/.test(curStatement.name)) {
              this.__logError(begin,Parser.INVALID_STATEMENT_NAME,[curStatement.name],throwErrors);
              return null;
            }

            curStatement.paramBlock = this.__unescapeParam(tpl,firstCharParamIndex,end);
            begin = nextBegin;
          } else {
            curStatement.name = "#CDATA#";

            const cdataEnd = tpl.indexOf("{/CDATA}");
            if (cdataEnd != -1) {
              curStatement.paramBlock = tpl.substring(end + 1, cdataEnd);
              const info = this.__findClosingBraces(tpl, cdataEnd + 1);
              begin = info.indexClose + 1;
              index = info.indexOpen;
            } else {
              this.__logError(begin,Parser.MISSING_CLOSING_STATEMENT,["CDATA"],throwErrors);
              return null;
            }
          }
        }
      }
    }
    end = tpl.length;
    if (end - begin > 0) {
      curStatement = {
        name: "$_",
        parent: stack[stack.length - 1],
        firstCharParamIndex: begin,
        lastCharParamIndex: end,
        paramBlock: this.__unescapeText(tpl, begin, end),
        lineNumber: this.positionToLineNumber(begin),
      };
      if (curStatement.paramBlock.length > 0) {
        curContainer.push(curStatement);
      }
    }
    if (stack.length > 1) {
      // TODO: ModernAria: Check Coercion assumption firstCharContentIndex will always be present.
      this.__logError(stack[stack.length - 1].firstCharContentIndex!, Parser.MISSING_CLOSING_STATEMENT, [stack[stack.length - 1].name], throwErrors);
      return null;
    }
    return res;
  }
}
