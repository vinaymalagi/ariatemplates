import { ClassGeneratorCfg, ClassGeneratorCfgSchema } from "./CfgBeans.js";
import { ClassWriter } from "./ClassWriter.js";
import { Parser } from "./Parser.js";
import { RootStatement } from "./tree-beans.js";


function normalizeOptions (optionsOrAllDeps: ClassGeneratorCfg | boolean | unknown, context: {[key: string]: unknown}, debug: boolean, skipLogError: boolean) {
  const options = (typeof optionsOrAllDeps == "object") ? optionsOrAllDeps : {
      allDependencies: optionsOrAllDeps,
      errorContext: context,
      debug: debug,
      skipLogError: skipLogError
  };
  //TODO:ModernAria:Config Beans
  ClassGeneratorCfgSchema.parse(options);
  return options;
};

export interface DependencySpec {
  library: string;
  importedItem: string;
}
export abstract class ClassGenerator {

  /**
   * Parser. It convert the text to a tree representation.
   * @type aria.templates.Parser
   * @protected
   */
  protected _parser: Parser;

  /**
   * Parse the given template, and send the generated class definition to the callback function. The first
   * parameter given to the callback function is: { classDef: {String} if null, errors occured during parsing or
   * class generation; otherwise contains the generated class }
   * @param {String} template the template
   * @param {aria.templates.CfgBeans:ClassGeneratorCfg} options Options for the class generation.
   * @param {aria.core.CfgBeans:Callback} callback the callback description
   */
  public parseTemplate(template: string, optionsOrAllDeps: object | boolean, callback: unknown, context: unknown, debug: boolean, skipLogError: boolean) {
    const options = normalizeOptions(optionsOrAllDeps, context, debug, skipLogError);
    const tree = this._parser.parseTemplate(template, options, [], options.throwErrors);
    if(tree) {
      this._buildClass(tree, options, callback);
    } else {
      //TODO:ModernAria:Handle callback preferably as return value or execption
      // callback.fn.call(callback.scope, {classDef: null});
    }
  }

  /**
   * Build the template class from the tree given by the parser.
   * @private
   * @param {aria.templates.TreeBeans:Root} tree tree returned by the parser.
   * @param {aria.templates.CfgBeans:ClassGeneratorCfg} options Options for class generation.
   * @param {aria.core.CfgBeans:Callback} callback the callback description
   */
  private _buildClass(tree: RootStatement, options: object, callback: unknown) {
    const out = new ClassWriter();
    out.processStatement$.subscribe(() => {

    })
  }


}
