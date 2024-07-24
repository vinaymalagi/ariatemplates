import { Subject } from "rxjs";



export interface ClassDefinitionConfig {
  $classpath?: string;
  $css?: string[];
  $csslibs?: string[];
  $macrolibs?: string[];
  $templates?: string[];
}


export function ClassDefinition(classDefinitionConfig: ClassDefinitionConfig) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends {new (...args: any[]): any}>(target: T, context: ClassDecoratorContext) {
    if (context.metadata) {
      context.metadata["classDefinitionConfig"] = classDefinitionConfig;
    }
    return class extends target {
      eventEmitters: Record<string, Subject<unknown>> = {};

      $dispose() {
        super.$dispose && typeof super.$dispose == 'function' && super.$dispose()
        Object.entries(this.eventEmitters).forEach(([, value]) => {
          value.complete();
        })
      }
    };
  };
}

// export interface ClassEventDefinition {
//   name: string;
// }

// export function AriaEvent(eventCfg: ClassEventDefinition) {
//   return function(targetProp: any, context: ClassFieldDecoratorContext | ClassSetterDecoratorContext) {

//   }
// }
