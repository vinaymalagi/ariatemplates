// ERROR MESSAGES:
export const NULL_PARAMETER = "Missing parameter in export const %1.";
export const NULL_CLASSPATH = "$classpath argument is mandatory and must be a string.";
export const INVALID_NAMESPACE = "Invalid namespace: %1";
export const INVALID_DEFCLASSPATH = "Invalid definition classpath: %1";
export const INVALID_CLASSNAME_FORMAT = "%2Invalid class name : '%1'. Class name must be a string and start with a capital case.";
export const INVALID_CLASSNAME_RESERVED = "%2Invalid class name: '%1'. Class name must be a string cannot be a reserved word.";
export const INVALID_PACKAGENAME_FORMAT = "%2Invalid package name : '%1'. Package name must be a string must start with a small case.";
export const INVALID_PACKAGENAME_RESERVED = "%2Invalid package name: '%1'. Package name must be a string cannot be a reserved word.";
export const EXPECT_CLASS_DEFINITION = '%2Expected Class Definition: passing classpath string is not allowed (%1). Use ES imports to import and pass the class ref directly';
export const INSTANCE_OF_UNKNOWN_CLASS = "Cannot create instance of class '%1'";
export const DUPLICATE_CLASSNAME = "class names in a class hierarchy must be different: %1";
export const WRONG_BASE_CLASS = "super class for %1 is not properly defined: base classes (%2) must be defined through export const classDefinition()";
export const BASE_CLASS_UNDEFINED = "super class for %1 is undefined (%2)";
export const INCOHERENT_CLASSPATH = "$class or $package is incoherent with $classpath";
export const INVALID_INTERFACES = "Invalid interface definition in Class %1";
// for constructors or destructors
export const PARENT_NOTCALLED = "Error: the %1 of %2 was not called in %3.";
// for constructors or destructors
export const WRONGPARENT_CALLED = "Error: the %1 of %2 was called instead of %3 in %4.";
export const REDECLARED_EVENT = "Redeclared event name: %1 in %2";
export const INVALID_EXTENDSTYPE = "Invalid $extendsType property for class %1.";
export const TEXT_TEMPLATE_HANDLE_CONFLICT = "Template error: can't load text template '%1' defined in '%2'. A macro, a library, a resource, a variable or another text template has already been declared with the same name.";
export const RESOURCES_HANDLE_CONFLICT = "Template error: can't load resources '%1' defined in '%2'. A macro, a library, a text template, a variable or another resource has already been declared with the same name.";
export const CANNOT_EXTEND_SINGLETON = "Class %1 cannot extend singleton class %2";
export const FUNCTION_PROTOTYPE_RETURN_NULL = "Prototype function of %1 cannot returns null";
export const TPLSCRIPT_INSTANTIATED_DIRECTLY = "Template scripts can not be instantiated directly";
export const OLD_DEPENDENCIES_SYNTAX = "Class %1 is using the old syntax for the following dependencies, without using the backward-compatible loader : %2";
