import { Action } from "../action.types.js";

export class ValidateJsonAction implements Action {
  execute(payload: any, config: any) {
    console.log("Validate JSON Action executing...");
    console.log("Payload:", payload);
    console.log("Config:", config);

    const errors: string[] = [];

    if (config?.requiredFields && Array.isArray(config.requiredFields)) {
      for (const field of config.requiredFields) {
        if (payload[field] === undefined || payload[field] === null) {
          errors.push(`Missing required field: "${field}"`);
        }
      }
    }

    if (config?.fieldTypes && typeof config.fieldTypes === 'object') {
      for (const [field, expectedType] of Object.entries(config.fieldTypes)) {
        const value = payload[field];
        if (value !== undefined && value !== null) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== expectedType) {
            errors.push(`Field "${field}" should be ${expectedType}, but got ${actualType}`);
          }
        }
      }
    }

    if (config?.enumFields && typeof config.enumFields === 'object') {
      for (const [field, allowedValues] of Object.entries(config.enumFields)) {
        const value = payload[field];
        if (value !== undefined && value !== null && Array.isArray(allowedValues)) {
          if (!allowedValues.includes(value)) {
            errors.push(`Field "${field}" value "${value}" not allowed. Allowed: ${allowedValues.join(', ')}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    return {
      valid: true,
      validatedAt: new Date().toISOString(),
      originalPayload: payload
    };
  }
}