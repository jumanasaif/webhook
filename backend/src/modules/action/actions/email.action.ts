import { Action } from "../action.types.js";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailAction implements Action {
  async execute(payload: any, config: any) {
    console.log("Email Action executing...");
    console.log("Payload keys:", Object.keys(payload));
    console.log("Has personal?", !!payload.personal);
    console.log("Has originalPayload?", !!payload.originalPayload);

    let toEmail = 
      config?.to ||                                    
      payload.to || 
      payload.email || 
      payload.recipient ||
      payload.personal?.email ||                      
      payload.originalPayload?.personal?.email ||      
      payload.user?.email;

    let userName = 
      payload.personal?.fullName ||
      payload.originalPayload?.personal?.fullName ||
      payload.name ||
      payload.userName;
    
    let subject = 
      payload.subject || 
      payload.title || 
      (userName ? `CV for ${userName}` : 'Webhook Notification');
    
    let emailBody = 
      payload.body || 
      payload.message || 
      payload.content;

    console.log("Found email:", toEmail);
    console.log("Found name:", userName);


    if (!toEmail) {
      console.error("Available fields in payload:", Object.keys(payload));
      if (payload.personal) {
        console.error("Personal fields:", Object.keys(payload.personal));
      }
      if (payload.originalPayload) {
        console.error("Original payload fields:", Object.keys(payload.originalPayload));
        if (payload.originalPayload.personal) {
          console.error("Original personal fields:", Object.keys(payload.originalPayload.personal));
        }
      }
      throw new Error('No email recipient found in payload. Please include "to", "email", or "personal.email" field.');
    }


    if (!emailBody) {

      if (payload.pdfBase64 || payload.originalPayload?.pdfBase64) {
        const pdfData = payload.pdfBase64 ? payload : payload.originalPayload;
        const downloadLink = pdfData.filePath ? 
          `\n\n📁 File saved at: ${pdfData.filePath}` : '';
        
        const personalInfo = payload.personal || payload.originalPayload?.personal;
        
        emailBody = `
          <h2>📄 CV Generated Successfully!</h2>
          <p>Hello ${userName || 'there'},</p>
          <p>Your CV has been generated successfully.</p>
          
          <h3>📋 CV Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${personalInfo?.fullName || userName || 'N/A'}</li>
            <li><strong>Email:</strong> ${personalInfo?.email || toEmail}</li>
            <li><strong>Location:</strong> ${personalInfo?.location || 'N/A'}</li>
            <li><strong>Template:</strong> ${pdfData.template || 'Professional'}</li>
            <li><strong>Size:</strong> ${Math.round((pdfData.pdfSize || pdfData.fileSize || 0) / 1024)} KB</li>
            <li><strong>Generated at:</strong> ${new Date(pdfData.generatedAt).toLocaleString()}</li>
          </ul>
          
          ${personalInfo?.summary ? `<h3>📝 Summary:</h3><p>${personalInfo.summary}</p>` : ''}
          
          ${downloadLink ? `<p><strong>💾 File saved at:</strong> ${downloadLink}</p>` : ''}
          
          <p>The PDF file is attached to this email.</p>
          
          <hr>
          <small>This is an automated email from Webhook Pipeline System.</small>
        `;
      } else {

        emailBody = `
          <h2>Webhook Notification</h2>
          <p>You received a new webhook:</p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
            ${JSON.stringify(payload, null, 2)}
          </pre>
          <p><small>Sent at: ${new Date().toISOString()}</small></p>
        `;
      }
    }


    const mailOptions: any = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: subject,
      html: emailBody,
    };


    const pdfBase64 = payload.pdfBase64 || payload.originalPayload?.pdfBase64;
    const pdfFileName = payload.fileName || payload.originalPayload?.fileName || `cv-${userName?.replace(/\s/g, '-') || 'generated'}.pdf`;
    
    if (pdfBase64) {
      mailOptions.attachments = [
        {
          filename: pdfFileName,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ];
      console.log("📎 Attaching PDF:", pdfFileName);
    }

    console.log("📧 Sending email to:", toEmail);
    console.log("📝 Subject:", subject);
    if (mailOptions.attachments) {
      console.log("📎 With attachment:", mailOptions.attachments[0].filename);
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        to: toEmail,
        subject: subject,
        sentAt: new Date().toISOString(),
        attachment: mailOptions.attachments ? {
          fileName: mailOptions.attachments[0].filename,
          size: mailOptions.attachments[0].content?.length || 0
        } : null
      };
    } catch (error: any) {
      console.error("❌ Failed to send email:", error.message);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}