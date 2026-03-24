import { Action } from "../action.types.js";

export class FilterAction implements Action {
  execute(payload: any, config: any) {
    const { field, operator, value } = config;

    if (operator === "eq" && payload[field] !== value) return null;
    if (operator === "gt" && payload[field] <= value) return null;
    if (operator === "lt" && payload[field] >= value) return null;

    return payload;
  }
}