import { TransformAction } from "./actions/transform.action.js";
import { FilterAction } from "./actions/filter.action.js";
import { EnrichAction } from "./actions/enrich.action.js";
import { EmailAction } from "./actions/email.action.js";
import { ValidateJsonAction } from "./actions/validateJson.action.js";
import { ReplaceTextAction } from "./actions/replaceText.action.js";
import { PdfGeneratorAction } from "./actions/pdfGenerator.action.js";

export const executeAction = async (
  type: string,
  payload: any,
  config: any
) => {
  console.log("Executing action:", type);
  console.log("With config:", config);
  
  switch (type) {
    case "transform":
      return new TransformAction().execute(payload, config);
      
    case "filter":
      return new FilterAction().execute(payload, config);
      
    case "enrich":
      return new EnrichAction().execute(payload);
      
    case "email":
      return await new EmailAction().execute(payload, config);
      
    case "validate_json":
      return new ValidateJsonAction().execute(payload, config);
      
    case "replace_text":
      return new ReplaceTextAction().execute(payload, config);
      
    case "pdf_generator":
      return await new PdfGeneratorAction().execute(payload, config);
      
    default:
      console.error("Unknown action type:", type);
      throw new Error(`Unknown action: ${type}`);
  }
};