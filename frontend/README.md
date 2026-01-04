# Shipet Frontend - Shipping & Logistics Platform

A complete, production-ready frontend for a shipping and logistics web application built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Modules
- **Authentication**: Login, Signup, Password Reset, Profile Management
- **Dashboard**: KPI Overview, Analytics, Quick Actions
- **Order Management**: Create, Track, Cancel, Reverse Orders
- **Shipment Management**: Book, Track, Cancel Shipments
- **Customer Management**: Add, List, Manage Customers
- **Product Management**: Add, List, Manage Products
- **Pickup Addresses**: Manage up to 5 pickup addresses
- **Wallet**: Transaction history and balance management
- **Cost Estimation**: Single, Multi-box, International shipping
- **Pincode Checker**: Serviceability verification
- **Bulk Operations**: Filter and manage multiple shipments
- **PDF Export**: Multi-shipment label downloads

### Technical Features
- **Modern Architecture**: Clean, scalable code structure
- **Responsive Design**: Mobile-first, accessible UI
- **State Management**: React Context + SWR for API caching
- **API Integration**: Centralized service layer
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with Next.js 15 features

## 📁 Project Structure

\`\`\`
shipet-frontend/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main application pages
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   └── layout/                  # Layout components
├── contexts/                     # React contexts
├── services/                     # API service layer
├── hooks/                        # Custom hooks
├── lib/                         # Utilities and helpers
└── types/                       # TypeScript type definitions
\`\`\`

## 🛠 Installation & Setup

1. **Clone and Install**
\`\`\`bash
git clone <repository-url>
cd shipet-frontend
npm install
\`\`\`

2. **Environment Setup**
\`\`\`bash
cp .env.example .env.local
# Update API_URL and other configurations
\`\`\`

3. **Development**
\`\`\`bash
npm run dev
# Open http://localhost:3000
\`\`\`

4. **Production Build**
\`\`\`bash
npm run build
npm start
\`\`\`

## 🏗 Architecture Overview

### API Integration Pattern
- **Centralized API Client**: Single configuration point
- **Service Layer**: Domain-specific API methods
- **Error Handling**: Consistent error management
- **Authentication**: Automatic token management

### State Management Strategy
- **React Context**: Global state (auth, theme)
- **SWR**: API caching and synchronization
- **Local State**: Component-specific state

### Component Architecture
- **Atomic Design**: Reusable UI components
- **Layout Components**: Consistent page structure
- **Feature Components**: Business logic components

## 🔄 User Flow Examples

### Order to Shipment Flow
1. **Create Order**: Customer details + items
2. **Generate Shipment**: Convert order to shipment
3. **Book Pickup**: Schedule pickup from address
4. **Track Progress**: Real-time status updates
5. **Handle Delivery**: Confirmation and billing

### Estimation Flow
1. **Enter Details**: Origin, destination, package info
2. **Check Serviceability**: Pincode verification
3. **Get Quotes**: Multiple courier options
4. **Select Service**: Choose best option
5. **Create Shipment**: Convert estimate to booking

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for tablets
- **Desktop Enhanced**: Full feature set on desktop
- **Accessibility**: WCAG 2.1 compliant

## 🔧 API Integration

### Service Structure
\`\`\`typescript
// Example service pattern
export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get('/orders')
    return response.data
  },
  
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post('/orders', data)
    return response.data
  }
}
\`\`\`

### Error Handling
- **Global Error Boundary**: Catch and display errors
- **API Error Handling**: Consistent error responses
- **User Feedback**: Toast notifications for actions

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching Strategy**: SWR for API response caching
- **Server Components**: Reduced client-side JavaScript

## 🔐 Security Features

- **Authentication**: JWT token-based auth
- **Route Protection**: Private route guards
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Built-in Next.js security headers

## 🧪 Testing Strategy

\`\`\`bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Coverage Report
npm run test:coverage
\`\`\`

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry integration ready
- **Performance Monitoring**: Web Vitals tracking
- **User Analytics**: Google Analytics setup
- **API Monitoring**: Request/response logging

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Environment Variables
\`\`\`bash
# Production environment
NEXT_PUBLIC_API_URL=https://api.shipet.com
NEXT_PUBLIC_APP_URL=https://shipet.com
\`\`\`

## 🔧 Development Guidelines

### Code Standards
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks

### Git Workflow
\`\`\`bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature
\`\`\`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Hook Form](https://react-hook-form.com)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process

## 📄 License

MIT License - see LICENSE file for details

---

This Shipet frontend provides a complete, production-ready foundation for your shipping and logistics platform. The modular architecture ensures easy scaling and maintenance while delivering an excellent user experience across all devices.
