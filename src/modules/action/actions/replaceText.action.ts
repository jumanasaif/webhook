import { Action } from "../action.types.js";

export class ReplaceTextAction implements Action {
  execute(payload: any, config: any) {
    console.log("Replace Text Action executing...");
    console.log("Payload:", payload);
    console.log("Config:", config);

    if (!config?.replacements || !Array.isArray(config.replacements)) {
      throw new Error('Replacements configuration is required');
    }

    const result = JSON.parse(JSON.stringify(payload)); 

    function replaceInObject(obj: any): any {
      if (typeof obj === 'string') {
        let modified = obj;
        for (const { find, replace } of config.replacements) {
          const regex = new RegExp(find, 'g');
          modified = modified.replace(regex, replace);
        }
        return modified;
      } else if (Array.isArray(obj)) {
        return obj.map(item => replaceInObject(item));
      } else if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          let newKey = key;
          newObj[newKey] = replaceInObject(value);
        }
        return newObj;
      }
      return obj;
    }

    const finalResult = replaceInObject(result);
    console.log("Replace result:", finalResult);
    return finalResult;
  }
}