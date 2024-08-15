import { glob } from "glob";
import fs from "node:fs";
// import { convertInternalImportToRelativePath } from "../src/aria/templates/class-generator-utils.js";
// import { log } from "../src/aria/core/Log.js";
import { processTemplateContent } from "./template-content-processor.js";

/** Path to root folder for source files to scan and compile */
const sourcesRootDir = process.cwd() + '/src';


const defaultClassGeneratorOptions = {
  allDependencies: false,
  debug: false,
  skipLogError: true,
  escapeHtmlByDefault: true,
  allowSectionsAsContainers: false,
  isInternalAriatemplatesBuild: true,
  sourcesRootDirectory: sourcesRootDir,
  defaultWidgetLibsImportSpecs: {
    aria: {
      importType: 'Default',
      modulePath: 'ariatemplates/aria/widgets/AriaLib.js',
      name: 'ariaWidgetsAriaLib',
      classpath: 'aria.widgets.AriaLib'
    }
  }
};

// ---- Process *.tpl Files ----
const tplFiles = await glob('**/*.tpl', {cwd: './src', ignore: ['**/tools/**', '**/tester/**'], posix: true});
console.log(`### Processing ${tplFiles.length} TPL FILES ###`, tplFiles);

if (tplFiles.length > 0) {
  const TplClassGenerator = await import('../src/aria/templates/TplClassGenerator.js').then(({TplClassGenerator}) => TplClassGenerator);
  for(let i = 0; i < tplFiles.length; i++) {
    const sourceFile = tplFiles[i];
    const sourceFileAbsolutePath = sourcesRootDir + '/' + sourceFile;
    console.log(`*** Compiling TPL File: ${sourceFileAbsolutePath} ***`);
    // console.log(`#### TPL Import to relative path: ${convertInternalImportToRelativePath('ariatemplates/aria/utils/String.js', sourceFile, sourcesRootDir)} ####`);

    const content = fs.readFileSync(sourceFileAbsolutePath, 'utf-8');

    const classGeneratorOptions = {
      ...defaultClassGeneratorOptions,
      errorContext: {
          "file_classpath" : sourceFile
      },
      sourceFilePath: sourceFileAbsolutePath,
    };
    try {
      const outputContent = await processTemplateContent(content, TplClassGenerator, classGeneratorOptions);
      const outputFileName = `${sourcesRootDir}/${sourceFile}.js`;
      fs.writeFileSync(outputFileName, outputContent, 'utf-8');
      console.log(`--- Template '${sourceFile}' compiled to javascript: ${outputFileName} ---`);
    } catch (error) {
      console.error(error);
    }
  }
}

// ---- Process *.tpl.css Files ----
const tplCssFiles = await glob('**/*.tpl.css', {cwd: './src', ignore: ['**/tools/**', '**/tester/**', '**/widgets/**'], posix: true});
console.log(`### Processing ${tplCssFiles.length} CSS FILES ###`, tplCssFiles);

if (tplCssFiles.length > 0) {
  const ClassGenerator = await import('../src/aria/templates/CSSClassGenerator.js').then(({CSSClassGenerator}) => CSSClassGenerator);
  for(let i = 0; i < tplCssFiles.length; i++) {
    const sourceFile = tplCssFiles[i];
    const sourceFileAbsolutePath = sourcesRootDir + '/' + sourceFile;
    console.log(`*** Compiling TPL File: ${sourceFileAbsolutePath} ***`);
    // console.log(`#### TPL Import to relative path: ${convertInternalImportToRelativePath('ariatemplates/aria/utils/String.js', sourceFile, sourcesRootDir)} ####`);

    const content = fs.readFileSync(sourceFileAbsolutePath, 'utf-8');

    const classGeneratorOptions = {
      ...defaultClassGeneratorOptions,
      errorContext: {
          "file_classpath" : sourceFile
      },
      sourceFilePath: sourceFileAbsolutePath,
    };
    try {
      const outputContent = await processTemplateContent(content, ClassGenerator, classGeneratorOptions);
      const outputFileName = `${sourcesRootDir}/${sourceFile}.js`;
      fs.writeFileSync(outputFileName, outputContent, 'utf-8');
      console.log(`--- Template '${sourceFile}' compiled to javascript: ${outputFileName} ---`);
    } catch (error) {
      console.error(error);
    }
  }
}

// ---- Process *.cml Files ----
const cmlFiles = await glob('**/*.cml', {cwd: './src', ignore: ['**/tools/**', '**/tester/**'], posix: true});
console.log(`### Processing ${cmlFiles.length} CSS FILES ###`, cmlFiles);

if (cmlFiles.length > 0) {
  const ClassGenerator = await import('../src/aria/templates/CmlClassGenerator.js').then(({CmlClassGenerator}) => CmlClassGenerator);
  for(let i = 0; i < cmlFiles.length; i++) {
    const sourceFile = cmlFiles[i];
    const sourceFileAbsolutePath = sourcesRootDir + '/' + sourceFile;
    console.log(`*** Compiling TPL File: ${sourceFileAbsolutePath} ***`);
    // console.log(`#### TPL Import to relative path: ${convertInternalImportToRelativePath('ariatemplates/aria/utils/String.js', sourceFile, sourcesRootDir)} ####`);

    const content = fs.readFileSync(sourceFileAbsolutePath, 'utf-8');

    const classGeneratorOptions = {
      ...defaultClassGeneratorOptions,
      errorContext: {
          "file_classpath" : sourceFile
      },
      sourceFilePath: sourceFileAbsolutePath,
    };
    try {
      const outputContent = await processTemplateContent(content, ClassGenerator, classGeneratorOptions);
      const outputFileName = `${sourcesRootDir}/${sourceFile}.js`;
      fs.writeFileSync(outputFileName, outputContent, 'utf-8');
      console.log(`--- Template '${sourceFile}' compiled to javascript: ${outputFileName} ---`);
    } catch (error) {
      console.error(error);
    }
  }
}


