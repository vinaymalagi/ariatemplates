
import { dirname, relative, resolve, sep } from 'node:path';




/**
 * Get the alias to refer to the imported item in the template code.
 *
 * @param {aria.templates.CfgBeans:NamedImportSpecCfg | aria.templates.CfgBeans:DefaultImportSpecCfg} importSpec
 * @returns {null | string}
 */
export function getUsageAliasFromNamedOrDefaultImportSpec(importSpec) {
  const importType = importSpec.importType || 'Default';
  switch (importType) {
    case 'Named':
      return importSpec.alias || importSpec.name || null;
    case 'Default':
      return importSpec.name || null;
    default:
      return null;
  }
}

/**
 *
 * @param {aria.templates.CfgBeans:BaseImportSpecCfg} importSpec
 * @returns aria.templates.CfgBeans:SideEffectImportSpecCfg
 */
export function convertToSideEffectImportSpec(importSpec) {
  if (importSpec.importType === 'SideEffect') {
    return importSpec;
  }
  return {
    importType: 'SideEffect',
    modulePath: importSpec.modulePath,
    classpath: importSpec.classpath
  };
}


/**
 *
 * @param {string} importedModulePath
 * @param {string} sourceFilePath
 * @param {string} rootPath
 *
 * @returns The relative path to imported file from the source file path if the imported module file path begins with ariate.
 */
export function convertInternalImportToRelativePath(importedModuleFile, sourceFile, rootDir) {
  // console.log('-------------------------------------------------------');
  // console.log(`SourceFile: ${sourceFile}, import: ${importedModuleFile}, rootDir: ${rootDir}`);

  rootDir = rootDir ? rootDir + '/' : '';

  if (!importedModuleFile.startsWith('ariatemplates/')) {
    return importedModuleFile;
  }

  const importedModuleFilePath = importedModuleFile.replace(/^ariatemplates\//,'').split('/').join('/');

  const resolvedSource = resolve(rootDir + '/' + sourceFile);
  const resolvedImportedPath = resolve( rootDir + importedModuleFilePath);
  const sourceDir = dirname(resolvedSource);

  // console.log(`Source dir: ${sourceDir}, import dir: ${importedPathDir}`);


  let relativeImportPath = relative(sourceDir, resolvedImportedPath);
  relativeImportPath = relativeImportPath.split(sep).join('/');
  if(!/^\.(\.?)\//.test(relativeImportPath) && relativeImportPath !== '') {
    relativeImportPath = './' + relativeImportPath;
  }
  return relativeImportPath;
}






