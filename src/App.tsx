import React, { useState } from 'react';
import { IndianRupee, Download, ArrowRight } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

interface LoanDetails {
  loanAmount: number;
  annualInterestRate: number;
  loanPeriodYears: number;
  startDate: string;
  name: string;
  processingFees: number;
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
  const value = Math.round(num).toString();
  let lastThree = value.substring(value.length - 3);
  let otherNumbers = value.substring(0, value.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

function numberToWords(num: number): string {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + single[num % 10] : '');
  };
  
  if (num === 0) return 'Zero';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remaining = num % 1000;
  
  let str = '';
  if (crore > 0) str += formatTens(crore) + ' Crore ';
  if (lakh > 0) str += formatTens(lakh) + ' Lakh ';
  if (thousand > 0) str += formatTens(thousand) + ' Thousand ';
  if (remaining > 0) str += formatTens(remaining);
  return str.trim() + ' Rupees';
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
}

function App() {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanAmount: 100000,
    annualInterestRate: 4,
    loanPeriodYears: 1,
    startDate: new Date().toISOString().split('T')[0],
    name: 'KoS',
    processingFees: 1380
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

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

    if (currentPage === 1) {
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
    } else {
      const contentDiv = content.querySelector('.bg-white.p-8');
      if (!contentDiv) return;

      const tempDiv = document.createElement('div');
      tempDiv.style.width = '1150px';
      tempDiv.style.padding = '30px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.innerHTML = contentDiv.innerHTML;
      document.body.appendChild(tempDiv);

      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        width: 1150,
        height: 1650,
        windowWidth: 1150,
        windowHeight: 1650,
        backgroundColor: 'white',
      }).then(canvas => {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = 2400;
        scaledCanvas.height = 3262;
        const ctx = scaledCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 2400, 3262);
          const scaledWidth = 2340;
          const scaledHeight = 3202;
          const x = (2400 - scaledWidth) / 2;
          const y = (3262 - scaledHeight) / 2;
          ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
        }

        const link = document.createElement('a');
        link.download = `${loanDetails.name}_certificate.png`;
        link.href = scaledCanvas.toDataURL('image/png');
        link.click();

        document.body.removeChild(tempDiv);
      });
    }
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

  const handlePageChange = () => {
    setCurrentPage(currentPage === 1 ? 2 : 1);
  };

  const firstEMIDate = new Date(loanDetails.startDate);
  firstEMIDate.setMonth(firstEMIDate.getMonth() + 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end gap-4 mb-4">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
          >
            <Download size={20} />
            <span>{currentPage === 1 ? 'Download PDF' : 'Download PNG'}</span>
          </button>
          <button
            onClick={handlePageChange}
            className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
          >
            <span>{currentPage === 1 ? 'Next' : 'Previous'}</span>
            {currentPage === 1 && <ArrowRight size={20} />}
          </button>
        </div>

        <div ref={contentRef}>
          {currentPage === 1 ? (
            <div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <img src="https://raw.githubusercontent.com/dljs2001/Images/main/logo.png" alt="Logo" className="w-full h-24 object-contain" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#8B0000] rounded-lg p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4">Loan Values</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label htmlFor="loanAmount" className="text-xl font-bold">Loan Amount</label>
                      <div className="flex flex-col">
                        <div className="text-xl font-extrabold mb-1 text-white text-left">
                          ( {numberToWords(loanDetails.loanAmount)} )
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-xl">₹</span>
                          <input
                            type="text"
                            id="loanAmount"
                            name="loanAmount"
                            value={formatIndianNumber(loanDetails.loanAmount)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                              handleInputChange({ target: { name: 'loanAmount', value } });
                            }}
                            className="w-32 bg-transparent text-white text-xl font-bold focus:outline-none text-right ml-1"
                          />
                        </div>
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
                  <h2 className="text-2xl font-bold mb-4">Loan Summary</h2>
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
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="max-w-4xl mx-auto">
                {/* Logo */}
                <div className="mb-8">
                  <img src="https://raw.githubusercontent.com/dljs2001/Images/main/logo.png" alt="Logo" className="w-full h-24 object-contain" />
                </div>

                {/* Date and Reference Number */}
                <div className="text-right mb-6">
                  <p className="text-[#404040] font-bold">{formatDate(loanDetails.startDate)}</p>
                  <p className="text-[#404040] font-bold">IDHADEL09559485</p>
                </div>

                {/* Greeting and Name */}
                <div className="mb-6">
                  <p className="text-[#404040]">Dear Sir / Madam,</p>
                  <p className="text-[#404040] font-bold">{loanDetails.name}</p>
                </div>

                {/* Certificate Details */}
                <div className="mb-8 text-[#404040]">
                  <p>
                    <span className="font-normal">Certificate of Approved Loan No. </span>
                    <span className="font-bold">IDHADEL09559485</span>
                  </p>
                  <p className="mt-4">
                    We acknowledge the receipt of minimal documentation from your end, and we sincerely appreciate your choice of Dhani Finance as your financial partner. With reference to your recent loan application, we are pleased to extend to you the following loan offer, subject to the specified terms and conditions, with the first Equated Monthly Instalment (EMI) scheduled for:
                  </p>
                  <p className="mt-4 font-bold">{formatDate(firstEMIDate.toISOString())}</p>
                </div>

                {/* Loan Details */}
                <div className="space-y-4 text-[#404040]">
                  <div className="flex">
                    <span className="w-48">Approved Loan Amount</span>
                    <span className="font-bold">₹ {formatIndianNumber(loanDetails.loanAmount)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">Interest Rate</span>
                    <span className="font-bold">{loanDetails.annualInterestRate}%</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">Loan Term</span>
                    <span className="font-bold">{loanDetails.loanPeriodYears * 12} Months</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">Monthly Payment (EMI)</span>
                    <span className="font-bold">₹ {formatIndianNumber(schedule[0]?.payment)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">Total Interest Payable</span>
                    <span className="font-bold">₹ {formatIndianNumber(totalInterest)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">Processing Fees</span>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">₹</span>
                      <input
                        type="number"
                        name="processingFees"
                        value={loanDetails.processingFees}
                        onChange={handleInputChange}
                        className="w-32 font-bold focus:outline-none text-[#404040]"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Text */}
                <div className="mt-8 text-[#404040]">
                  <p className="mb-4">
                    Please note that this loan offer is contingent upon your acceptance of the aforementioned terms and conditions. Should you wish to proceed with this loan, kindly respond to this communication at your earliest convenience.
                  </p>
                  <p className="mb-4">
                    We look forward to serving your financial needs and fostering a long-lasting partnership with you. Should you have any questions or require further clarification, please do not hesitate to reach out to our dedicated customer service team.
                  </p>
                  <p>
                    Thank you once again for choosing Dhani Finance as your trusted financial institution.
                  </p>
                </div>

                {/* Signature Image */}
                <div className="mt-12 mb-4">
                  <img 
                    src="https://raw.githubusercontent.com/dljs2001/Images/refs/heads/main/sign.png"
                    alt="Signature" 
                    className="w-full h-auto mx-auto mb-8" 
                  />
                  <div className="text-[#404040] text-sm italic underline text-left font-bold space-y-1">
                    <p>This is a system</p>
                    <p>generated letter and</p>
                    <p>hence does not require any</p>
                    <p>signature.</p>
                  </div>
                </div>

                {/* Corporate Office */}
                <div className="mt-8 border-t border-[#08447F] pt-4 text-center">
                  <p className="text-[#404040] text-sm italic font-bold">Corporate Offices:</p>
                  <p className="text-[#404040] text-xs">
                    One International Centre (Formerly IFC), Senapati Bapat Marg, Elphinstone Road, Mumbai - 400 013
                  </p>
                  <p className="text-[#404040] text-xs">
                    5th Floor, Plot no. 108, IT Park, Udyog Vihar, Phase-1, Gurugram, Haryana-122016
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
