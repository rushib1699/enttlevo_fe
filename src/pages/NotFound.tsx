import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  AlertTriangle, 
} from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/sales');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                404
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          
          <p className="text-gray-500 mb-8">
            Don't worry, you can find what you're looking for using the links below.
          </p>

          <Badge variant="outline" className="text-sm">
            <Search className="w-4 h-4 mr-2" />
            Error 404 - Page Not Found
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            onClick={handleGoBack}
            variant="outline" 
            size="lg"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
          
          <Button 
            onClick={handleGoHome}
            size="lg"
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            © 2024 Enttlevo. All rights reserved. | 
            <span className="text-orange-500 ml-1">Error Code: 404</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;