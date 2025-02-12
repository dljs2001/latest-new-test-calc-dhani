import React, { useState, useRef } from 'react';
import { IndianRupee, Printer, ArrowRight } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface LoanDetails {
  loanAmount: number;
  annualInterestRate: number;
  loanPeriodYears: number;
  startDate: string;
  name: string;
}

interface Payment {
  paymentNo: number;
  paymentDate: string;
  amount: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}

function formatIndianNumber(num: number): string {
  if (isNaN(num)) return '0';
  const value = Math.round(num);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(value);
}

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanAmount: 50000,
    annualInterestRate: 4,
    loanPeriodYears: 1,
    startDate: '2025-02-06',
    name: 'Ananda'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDownloadPDF = () => {
    const content = contentRef.current;
    if (!content) return;

    const opt = {
      margin: 10,
      filename: `${loanDetails.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        windowWidth: 1200
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(content).save();
  };

  const calculateAmortizationSchedule = (details: LoanDetails): Payment[] => {
    const monthlyRate = details.annualInterestRate / 12 / 100;
    const numberOfPayments = details.loanPeriodYears * 12;
    const monthlyPayment = (details.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    let balance = details.loanAmount;
    const schedule: Payment[] = [];
    const startDate = new Date(details.startDate);

    for (let i = 1; i <= numberOfPayments; i++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      balance -= principal;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + i);

      schedule.push({
        paymentNo: i,
        paymentDate: paymentDate.toLocaleDateString('en-IN', { 
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        }),
        amount: Math.round(balance),
        payment: Math.round(monthlyPayment),
        principal: Math.round(principal),
        interest: Math.round(interest),
        endingBalance: Math.round(balance)
      });
    }

    return schedule;
  };

  const schedule = calculateAmortizationSchedule(loanDetails);
  const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
  const totalCost = Number(loanDetails.loanAmount) + totalInterest;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end gap-4 mb-4">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
          >
            <Printer size={20} />
            <span>Download PDF</span>
          </button>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
          >
            <span>Next</span>
            <ArrowRight size={20} />
          </a>
        </div>

        <div ref={contentRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <img src="https://i.imgur.com/4Rj60nI.png" alt="Logo" className="w-full h-24 object-contain" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#8B0000] rounded-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">LOAN VALUES</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="loanAmount" className="text-xl font-bold">Loan Amount</label>
                  <div className="flex items-center">
                    <span className="mr-2 text-xl">₹</span>
                    <input
                      type="number"
                      id="loanAmount"
                      name="loanAmount"
                      value={loanDetails.loanAmount}
                      onChange={handleInputChange}
                      className="w-32 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label htmlFor="annualInterestRate" className="text-xl font-bold">Annual interest rate</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="annualInterestRate"
                      name="annualInterestRate"
                      value={loanDetails.annualInterestRate}
                      onChange={handleInputChange}
                      className="w-16 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
                    />
                    <span className="ml-2 text-xl">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label htmlFor="loanPeriodYears" className="text-xl font-bold">Loan Period In Years</label>
                  <input
                    type="number"
                    id="loanPeriodYears"
                    name="loanPeriodYears"
                    value={loanDetails.loanPeriodYears}
                    onChange={handleInputChange}
                    className="w-32 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label htmlFor="startDate" className="text-xl font-bold">Start Date Of Loan</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={loanDetails.startDate}
                    onChange={handleInputChange}
                    className="w-40 bg-transparent text-white text-xl font-bold focus:outline-none"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label htmlFor="name" className="text-xl font-bold">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={loanDetails.name}
                    onChange={handleInputChange}
                    className="w-40 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#8B0000] rounded-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">LOAN VALUES</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Monthly Payment</span>
                  <span>₹ {formatIndianNumber(schedule[0]?.payment)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Number Of Payments</span>
                  <span>{schedule.length}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Interest</span>
                  <span>₹ {formatIndianNumber(totalInterest)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Cost Of Loan</span>
                  <span>₹ {formatIndianNumber(totalCost)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Date</span>
                  <span>{new Date(loanDetails.startDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <h2 className="text-2xl font-bold text-center py-4 bg-[#8B0000] text-white">
              Loan Details Monthly Break-Up
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#8B0000]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Pymnt No.
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Ending Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.map((payment, index) => (
                    <tr key={payment.paymentNo} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        {String(payment.paymentNo).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        {payment.paymentDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹ {formatIndianNumber(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹ {formatIndianNumber(payment.payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹ {formatIndianNumber(payment.principal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹ {formatIndianNumber(payment.interest)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹ {formatIndianNumber(payment.endingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;