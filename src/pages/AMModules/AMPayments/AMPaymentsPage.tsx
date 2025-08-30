import React, { useState } from 'react'
import { FileText, CreditCard, Receipt } from 'lucide-react'
import EstimatesPage from './Estimates/EstimatesPage'
import InvoicesPage from './Inovices/InovicesPage'
import PaymentsPage from './Payments/PaymnetsPage'

const AMPaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('estimates')

  return (
    <div className="space-y-4">
      <div className="w-full">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('estimates')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'estimates' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <FileText className="w-4 h-4" />
              Estimates
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'invoices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Receipt className="w-4 h-4" />
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'payments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </button>
          </nav>
        </div>

        <div className="mt-2">
          {activeTab === 'estimates' && <EstimatesPage />}
          {activeTab === 'invoices' && <InvoicesPage />}
          {activeTab === 'payments' && <PaymentsPage />}
        </div>
      </div>
    </div>
  )
}

export default AMPaymentsPage