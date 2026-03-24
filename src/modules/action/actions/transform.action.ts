import { Action } from "../action.types.js";

export class TransformAction implements Action {
  execute(payload: any, config: any) {
    console.log("Transform Action executing...");
    console.log("Payload:", payload);
    console.log("Config:", config);
    
    let result = { ...payload };
    
    if (config?.rename && typeof config.rename === 'object') {
      for (const key in config.rename) {
        const newKey = config.rename[key];
        if (payload[key] !== undefined) {
          result[newKey] = payload[key];
          delete result[key];
          console.log(`Renamed "${key}" to "${newKey}"`);
        }
      }
    }
    
    if (config?.transform === 'uppercase') {
      console.log("Applying uppercase transformation...");
      for (const key in result) {
        if (typeof result[key] === 'string') {
          result[key] = result[key].toUpperCase();
          console.log(`Converted "${key}" to uppercase: ${result[key]}`);
        }
      }
    }
    
    console.log("Transform result:", result);
    return result;
  }
}