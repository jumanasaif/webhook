import { Action } from "../action.types.js";

export class EnrichAction implements Action {
  execute(payload: any) {
    return {
      ...payload,
      enrichedAt: new Date(),
      source: "webhook-system",
    };
  }
}