import type { EmailComponent } from '../types/email'

export function componentToHtml(component: EmailComponent): string {
  const { content } = component

  switch (component.type) {
    case 'text':
      return `
        <h1 style="
          font-size: ${content.fontSize || '24px'};
          font-weight: ${content.fontWeight || 'bold'};
          color: ${content.color || '#000000'};
          text-align: ${content.textAlign || 'center'};
          margin: 20px 0;
          font-family: Arial, Helvetica, sans-serif;
        ">
          ${content.content || ''}
        </h1>
      `

    case 'paragraph':
      return `
        <p style="
          font-size: ${content.fontSize || '16px'};
          color: ${content.color || '#333333'};
          line-height: ${content.lineHeight || '1.6'};
          text-align: ${content.textAlign || 'left'};
          margin: 16px 0;
          font-family: Arial, Helvetica, sans-serif;
        ">
          ${content.content || ''}
        </p>
      `

    case 'image':
      return `
        <div style="text-align: center; margin: 20px 0;">
          <img 
            src="${content.src || ''}"
            alt="${content.alt || ''}"
            style="
              width: ${content.width || '100%'};
              height: ${content.height || 'auto'};
              max-width: 100%;
              border-radius: 8px;
              display: block;
              margin: 0 auto;
            "
          />
        </div>
      `

    case 'button':
      return `
        <div style="text-align: center; margin: 24px 0;">
          <a 
            href="${content.href || '#'}"
            style="
              background-color: ${content.backgroundColor || '#D97706'};
              color: ${content.color || '#ffffff'};
              padding: ${content.padding || '12px 24px'};
              border-radius: ${content.borderRadius || '6px'};
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              font-weight: 500;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            ${content.text || 'Click Here'}
          </a>
        </div>
      `

    case 'divider':
      return `
        <hr style="
          height: ${content.height || '1px'};
          background-color: ${content.backgroundColor || '#e5e7eb'};
          border: none;
          margin: ${content.margin || '40px 0'};
        " />
      `

    case 'section':
      const childrenHtml = component.children?.map(child => componentToHtml(child)).join('') || ''
      return `
        <div style="
          background-color: ${content.backgroundColor || '#ffffff'};
          padding: ${content.padding || '20px'};
          width: 100%;
        ">
          ${childrenHtml}
        </div>
      `

    case 'container':
      const containerChildrenHtml = component.children?.map(child => componentToHtml(child)).join('') || ''
      return `
        <div style="
          max-width: ${content.maxWidth || '600px'};
          margin: ${content.margin || '0 auto'};
          padding: ${content.padding || '20px'};
        ">
          ${containerChildrenHtml}
        </div>
      `

    default:
      return `<!-- Unknown component type: ${component.type} -->`
  }
}

export function componentsToHtml(components: EmailComponent[]): string {
  const componentsHtml = components.map(component => componentToHtml(component)).join('')
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        a {
            color: inherit;
        }
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            h1 {
                font-size: 24px !important;
            }
            p {
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${componentsHtml}
    </div>
</body>
</html>
  `.trim()
}

export function downloadHtml(components: EmailComponent[], filename: string = 'email-template.html') {
  const html = componentsToHtml(components)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
} 