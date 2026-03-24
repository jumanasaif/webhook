import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = {
  professional: 'professional.html',
  modern: 'modern.html',
  simple: 'simple.html'
};

interface CVData {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    summary?: string;
  };
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }>;
  skills: string[];
}


function renderTemplate(template: string, data: CVData): string {
  let html = template;
  
  html = html.replace(/\{\{personal\.fullName\}\}/g, data.personal.fullName || '');
  html = html.replace(/\{\{personal\.email\}\}/g, data.personal.email || '');
  html = html.replace(/\{\{personal\.phone\}\}/g, data.personal.phone || '');
  html = html.replace(/\{\{personal\.location\}\}/g, data.personal.location || '');
  html = html.replace(/\{\{personal\.linkedin\}\}/g, data.personal.linkedin || '');
  html = html.replace(/\{\{personal\.github\}\}/g, data.personal.github || '');
  html = html.replace(/\{\{personal\.summary\}\}/g, (data.personal.summary || '').replace(/\n/g, '<br>'));
  html = html.replace(/\{\{generatedDate\}\}/g, new Date().toLocaleDateString());
  
  let experienceHtml = '';
  for (const exp of data.experience) {
    experienceHtml += `
      <div class="entry">
        <div class="entry-title">${escapeHtml(exp.title)}</div>
        <div class="entry-subtitle">${escapeHtml(exp.company)}</div>
        <div class="entry-date">${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</div>
        <div class="entry-description">${(exp.description || '').replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }
  html = html.replace(/\{\{#each experience\}\}[\s\S]*?\{\{\/each\}\}/, experienceHtml);
  
  let educationHtml = '';
  for (const edu of data.education) {
    educationHtml += `
      <div class="entry">
        <div class="entry-title">${escapeHtml(edu.degree)}</div>
        <div class="entry-subtitle">${escapeHtml(edu.institution)}</div>
        <div class="entry-date">${escapeHtml(edu.year)}</div>
        ${edu.description ? `<div class="entry-description">${escapeHtml(edu.description)}</div>` : ''}
      </div>
    `;
  }
  html = html.replace(/\{\{#each education\}\}[\s\S]*?\{\{\/each\}\}/, educationHtml);
  
  let skillsHtml = '';
  for (const skill of data.skills) {
    skillsHtml += `<li>${escapeHtml(skill)}</li>`;
  }
  html = html.replace(/\{\{#each skills\}\}[\s\S]*?\{\{\/each\}\}/, skillsHtml);
  
  html = html.replace(/\{\{#if personal\.summary\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
    return data.personal.summary ? match.replace(/\{\{#if personal\.summary\}\}|\{\{\/if\}\}/g, '') : '';
  });
  
  html = html.replace(/\{\{#if experience\.length\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
    return data.experience.length > 0 ? match.replace(/\{\{#if experience\.length\}\}|\{\{\/if\}\}/g, '') : '';
  });
  
  html = html.replace(/\{\{#if education\.length\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
    return data.education.length > 0 ? match.replace(/\{\{#if education\.length\}\}|\{\{\/if\}\}/g, '') : '';
  });
  
  html = html.replace(/\{\{#if skills\.length\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
    return data.skills.length > 0 ? match.replace(/\{\{#if skills\.length\}\}|\{\{\/if\}\}/g, '') : '';
  });
  
  return html;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


export async function generateCV(data: CVData, templateName: string = 'professional'): Promise<Buffer> {
  const templateFile = templates[templateName as keyof typeof templates] || templates.professional;
  const templatePath = path.join(__dirname, '../templates/pdf', templateFile);
  
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  const html = renderTemplate(template, data);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security'
      ],
      timeout: 30000
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1
    });
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      },
      timeout: 30000
    });
    
    await page.close();
    await browser.close();
    
    return Buffer.from(pdf);
    
  } catch (error: any) {
    console.error("Puppeteer error:", error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
 
      }
    }
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

export async function saveCVToFile(data: CVData, filepath: string, templateName: string = 'professional'): Promise<string> {
  const pdf = await generateCV(data, templateName);
  fs.writeFileSync(filepath, pdf);
  return filepath;
}