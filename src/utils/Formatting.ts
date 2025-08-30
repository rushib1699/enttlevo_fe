import React from 'react';
import { createElement } from 'react';
import showdown from 'showdown';

interface FormattedSection {
  type: 'text' | 'math' | 'equation';
  content: string;
}

// Add converter initialization
const converter = new showdown.Converter({
  simplifiedAutoLink: true,
  strikethrough: true,
  tables: true,
  tablesHeaderId: true,
  parseImgDimensions: true,
  ghCodeBlocks: true,
  ghCompatibleHeaderId: true,
  ghCodeBlocksContainer: 'div',
  ghCodeBlocksContainerClass: 'my-4'
});

export const parseMathContent = (text: string): FormattedSection[] => {

  // Make top-level headers h2
  converter.setOption('headerLevelStart', 2);

  // Convert markdown to HTML first
  const htmlContent = converter.makeHtml(text);
  
  // Add custom table styling to HTML content
  const styledHtmlContent = htmlContent
  .replace(
    /<table>/g, 
    '<table class="min-w-full divide-y divide-gray-200">'
  )
  .replace(
    /<h2>/g,
    '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-800">'
  )
  .replace(
    /<h3>/g,
    '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-700">'
  )
  .replace(
    /<ul>/g,
    '<ul class="list-disc pl-6 mb-4 space-y-2">'
  )
  .replace(
    /<li>/g,
    '<li class="text-gray-600">'
  )
  .replace(
    /<strong>/g,
    '<strong class="font-semibold text-gray-800">'
  )
  .replace(
    /<p>/g,
    '<p class="mb-4 leading-relaxed text-gray-700">'
  );


  // Continue with existing math parsing logic, but use htmlContent instead of text
  const sections: FormattedSection[] = [];
  const parts = styledHtmlContent.split(/(\\\[.*?\\\])/s);
  
  parts.forEach(part => {
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      // Extract math content between \[ and \]
      const mathContent = part.slice(2, -2).trim();
      sections.push({
        type: 'equation',
        content: mathContent
          .replace(/\\left/g, '')
          .replace(/\\right/g, '')
          .replace(/\\text\{([^}]+)\}/g, '$1')
          .replace(/\\times/g, '×')
          .replace(/\\approx/g, '≈')
          .replace(/\\%/g, '%')
          .replace(/\\div/g, '÷')
          .replace(/\\cdot/g, '·')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
          .replace(/\\left\(/g, '(')
          .replace(/\\right\)/g, ')')
          .replace(/\\left\[/g, '[')
          .replace(/\\right\]/g, ']')
      });
    } else if (part.trim()) {
      // Handle inline math mode (\( ... \)) and bold text
      const inlineParts = part.split(/(\\\(.*?\\\)|\*\*.*?\*\*)/s);
      
      inlineParts.forEach(inlinePart => {
        if (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) {
          sections.push({
            type: 'math',
            content: inlinePart.slice(2, -2).trim()
              .replace(/\\left/g, '')
              .replace(/\\right/g, '')
              .replace(/\\text\{([^}]+)\}/g, '$1')
              .replace(/\\times/g, '×')
              .replace(/\\approx/g, '≈')
              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
              .replace(/\\left\(/g, '(')
              .replace(/\\right\)/g, ')')
          });
        } else if (inlinePart.startsWith('**') && inlinePart.endsWith('**')) {
          sections.push({
            type: 'text',
            content: `<strong>${inlinePart.slice(2, -2)}</strong>`
          });
        } else if (inlinePart.trim()) {
          sections.push({
            type: 'text',
            content: inlinePart.trim()
          });
        }
      });
    }
  });
  
  return sections;
};

export const renderMathContent = (sections: FormattedSection[]): React.ReactNode[] => {
    return sections.map((section, index): React.ReactNode => {
      switch (section.type) {
        case 'equation':
          return createElement('div', {
            key: index,
            className: "my-4 text-center bg-gray-50 p-4 rounded-lg font-mono text-lg leading-relaxed"
          }, section.content);
        case 'math':
          return createElement('span', {
            key: index,
            className: "px-1 bg-gray-50 rounded font-mono"
          }, section.content);
        default:
          return createElement('span', {
            key: index,
            dangerouslySetInnerHTML: { __html: section.content }
          });
      }
    });
  };