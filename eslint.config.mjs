import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {languageOptions: { globals: {...globals.browser} }},
  pluginJs.configs.recommended,
  {
    rules: {
      "prefer-const": "error",
      // "eqeqeq": "warn",
      "no-invalid-this": "error",
      "semi": "error"
      // "no-var": "error"
    }
  }
];
