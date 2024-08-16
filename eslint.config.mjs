import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  pluginJs.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "prefer-const": "error",
      // "eqeqeq": "warn",
      "no-invalid-this": "error",
      "semi": "error"
      // "no-var": "error"
    }
  },
  {
    files: ["template-compile-scripts/**/*.js", "src/aria/templates/class-generator-utils.js", "src/aria/templates/*ClassGenerator.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
