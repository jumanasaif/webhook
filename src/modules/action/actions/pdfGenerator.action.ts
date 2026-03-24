import { Action } from "../action.types.js";
import { generateCV, saveCVToFile } from "../../../utils/pdfGenerator.js";
import fs from 'fs';
import path from 'path';

export class PdfGeneratorAction implements Action {
  async execute(payload: any, config: any) {
    console.log("PDF Generator Action executing...");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("Config:", config);

    const {
      template = 'professional',
      output = 'buffer',
      outputPath = './output/cvs/',
      filename = `cv-{{name}}.pdf`
    } = config;

    if (!payload.personal || !payload.personal.fullName) {
      throw new Error('Missing required CV data: personal.fullName is required');
    }

    if (output === 'file' || output === 'both') {
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
    }

    const cleanName = payload.personal.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const finalFilename = filename
      .replace('{{name}}', cleanName)
      .replace('{{fullName}}', cleanName)
      .replace(/[<>:"/\\|?*]/g, '-');

    let result: any = {
      success: true,
      generatedAt: new Date().toISOString(),
      template: template,
      originalPayload: payload,
      personal: payload.personal,
      experience: payload.experience,
      education: payload.education,
      skills: payload.skills
    };

    try {
      const pdfBuffer = await generateCV(payload, template);

      if (output === 'buffer') {
        result.pdfBase64 = pdfBuffer.toString('base64');
        result.pdfSize = pdfBuffer.length;
      } 
      else if (output === 'file') {
        const fullPath = path.join(outputPath, finalFilename);
        fs.writeFileSync(fullPath, pdfBuffer);
        result.filePath = fullPath;
        result.fileName = finalFilename;
        result.fileSize = pdfBuffer.length;
      }
      else if (output === 'both') {
        const fullPath = path.join(outputPath, finalFilename);
        fs.writeFileSync(fullPath, pdfBuffer);
        result.filePath = fullPath;
        result.fileName = finalFilename;
        result.fileSize = pdfBuffer.length;
        result.pdfBase64 = pdfBuffer.toString('base64');
      }

      console.log("PDF generated successfully!");
      console.log("Result contains personal.email:", !!result.personal?.email);
      return result;
      
    } catch (error: any) {
      console.error("PDF generation failed:", error.message);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}