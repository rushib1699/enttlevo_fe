# Enttlevo Frontend

A modern React application built with TypeScript, Vite, and Shadcn UI for managing sales, onboarding, and account management workflows.

## 🚀 Features

- **Modern Tech Stack**: React 18, TypeScript, Vite
- **UI Framework**: Shadcn UI with Tailwind CSS
- **State Management**: Zustand for global state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Charts & Visualizations**: Recharts, Chart.js, Nivo
- **Calendar**: FullCalendar integration
- **Workflow Builder**: React Flow for visual workflow creation
- **Email Integration**: Google, Zoho, and custom SMTP/IMAP
- **Authentication**: JWT-based authentication
- **Responsive Design**: Mobile-first approach

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## ��️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd enttlevo-fe
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_APP_API_BASE_URL=https://dev-api.enttlevo.online
VITE_SESSION_COOKIE_NAME=enttlevo_session

# Session Keys
VITE_USER_SESSION_KEY=user_session
VITE_USER_PERMISSION_SESSION_KEY=user_permissions
VITE_COMPANY_PERMISSION_SESSION_KEY=company_permissions
VITE_COMPANY_INTEGRATION_SESSION_KEY=company_integrations

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/settings/profile

# Zoho OAuth
VITE_ZOHO_CLIENT_ID=your_zoho_client_id
VITE_ZOHO_REDIRECT_URI=http://localhost:3000/settings/profile

# Call Hippo Integration
VITE_CALL_HIPPO_API_KEY=your_call_hippo_api_key
VITE_CALL_HIPPO_ACCOUNT_ID=your_call_hippo_account_id
VITE_CALL_HIPPO_USER_ID=your_call_hippo_user_id
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
enttlevo-fe/
├── public/                 # Static assets
├── src/
│   ├── api/               # API functions and configurations
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Table/        # Data table components
│   │   ├── Graphs/       # Chart and visualization components
│   │   └── ...
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   │   ├── Auth/         # Authentication pages
│   │   ├── Dashboard/    # Dashboard pages
│   │   ├── SalesModules/ # Sales management
│   │   ├── AMModules/    # Account management
│   │   ├── OBModules/    # Onboarding modules
│   │   ├── Settings/     # Settings and configuration
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── main.tsx          # Application entry point
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

This project uses **Shadcn UI** components built on top of **Radix UI** primitives. Key components include:

- **Data Tables**: Material-UI DataGrid integration
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts, Chart.js, and Nivo visualizations
- **Workflow Builder**: React Flow for visual workflows
- **Calendar**: FullCalendar integration
- **Notifications**: Sonner toast notifications

## 🔧 Configuration Files

- `components.json` - Shadcn UI configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules

## 🌐 API Integration

The application integrates with multiple services:

- **Backend API**: RESTful API for data management
- **Google OAuth**: Email and calendar integration
- **Zoho OAuth**: Email and contact management
- **Custom SMTP/IMAP**: Custom email server configuration
- **Call Hippo**: Call tracking and management

## 🔐 Authentication

The application uses JWT-based authentication with:

- Session management via cookies
- Role-based access control
- Permission-based feature access
- Protected routes

## 📊 Features Overview

### Sales Management
- Lead and deal management
- Pipeline visualization
- Sales analytics and reporting
- Customer relationship management

### Account Management
- Customer account management
- Product and service tracking
- Payment and renewal tracking
- Account health monitoring

### Onboarding
- Customer onboarding workflows
- Task management
- Progress tracking
- Document management

### Workflows
- Visual workflow builder
- Automation rules
- Email campaigns
- Integration management

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill the process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Node modules issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

### Environment Variables

Ensure all required environment variables are properly set in your `.env` file. Missing variables may cause authentication or integration issues.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Check the existing issues in the repository
- Create a new issue with detailed information
- Contact the development team

---

**Note**: This is a development version. For production deployment, ensure proper environment configuration and security measures are in place.
```

I've created a comprehensive README.md with proper installation steps that includes:

## Key Sections Added:

1. **Project Overview** - Clear description of the application and its features
2. **Prerequisites** - Required software and versions
3. **Step-by-step Installation** - Detailed installation process
4. **Environment Configuration** - Complete list of required environment variables
5. **Project Structure** - Organized file structure explanation
6. **Available Scripts** - All npm/yarn commands
7. **UI Components** - Overview of the component system
8. **Configuration Files** - Important config files explained
9. **API Integration** - External service integrations
10. **Authentication** - Security and access control
11. **Features Overview** - Detailed feature breakdown
12. **Troubleshooting** - Common issues and solutions
13. **Contributing Guidelines** - How to contribute to the project

## Key Features Highlighted:

- **Modern Tech Stack**: React 18, TypeScript, Vite
- **UI Framework**: Shadcn UI with Tailwind CSS
- **Multiple Integrations**: Google, Zoho, Custom Email
- **Comprehensive Features**: Sales, AM, OB modules
- **Development Tools**: ESLint, TypeScript, Hot reloading

The README now provides everything a developer needs to get the project up and running, from initial setup to understanding the codebase structure and available features.