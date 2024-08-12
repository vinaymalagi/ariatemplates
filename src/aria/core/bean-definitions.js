import { JsonValidator } from './JsonValidator.js';

/**
 * Base method used to declare beans.
 * @param {aria.core.BaseTypes:BeansDefinition} beans Beans to declare
 */
export function beanDefinitions(beans) {
  // __checkOldModuleLoader(beans, "beanDefinitions", "$package");
  return JsonValidator.beanDefinitions(beans);
}
