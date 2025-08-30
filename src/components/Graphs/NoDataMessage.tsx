import React from 'react';
import { BarChart3 } from 'lucide-react';

const NoDataMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-gray-50 rounded-lg">
    <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
    <p className="text-gray-600 text-xl font-medium mb-2">No Data Available</p>
    <p className="text-gray-400 text-sm text-center">
      There is no data to display at the moment. Please try again later or adjust your filters.
    </p>
  </div>
);

export default NoDataMessage;