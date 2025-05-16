import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Payment {
  paymentNo: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}

interface LoanDetails {
  loanAmount: number;
  annualInterestRate: number;
  loanPeriodYears: number;
  startDate: string;
  name: string;
  processingFee: number; // Add this new field
}

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanAmount: 100000,
    annualInterestRate: 4,
    loanPeriodYears: 1,
    startDate: new Date().toISOString().split('T')[0],
    name: 'KoS',
    processingFee: 1380 // Default processing fee
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatIndianNumber = (num: number): string => {
    if (isNaN(num)) return '0';
    
    const str = Math.abs(num).toString();
    let lastThree = str.substring(str.length - 3);
    let otherNumbers = str.substring(0, str.length - 3);
    
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    
    // Place the comma after every 2 digits in the remaining part
    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    
    return num < 0 ? '-' + formatted : formatted;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const numberToWords = (num: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
      return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };
    
    if (num === 0) return 'Zero';
    
    let result = '';
    let crore = Math.floor(num / 10000000);
    let lakh = Math.floor((num % 10000000) / 100000);
    let thousand = Math.floor((num % 100000) / 1000);
    let remaining = num % 1000;
    
    if (crore > 0) {
      result += convertLessThanOneThousand(crore) + ' Crore ';
    }
    
    if (lakh > 0) {
      result += convertLessThanOneThousand(lakh) + ' Lakh ';
    }
    
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    
    if (remaining > 0) {
      result += convertLessThanOneThousand(remaining);
    }
    
    return result.trim();
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
        allowTaint: true,
        logging: true,
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
        paymentDate: formatDate(paymentDate.toISOString()),
        amount: details.loanAmount,
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

  const firstEMIDate = new Date(loanDetails.startDate);
  firstEMIDate.setMonth(firstEMIDate.getMonth() + 1);

  const [showCertificate, setShowCertificate] = useState(false);
  const certificateCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleViewCertificate = () => {
    setShowCertificate(true);
  };

  const handleBackToLoanDetails = () => {
    setShowCertificate(false);
  };

  const handleDownloadCertificate = () => {
    const canvas = certificateCanvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `${loanDetails.name}_certificate.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Draw certificate content on canvas
  const drawCertificate = () => {
    const canvas = certificateCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = 1192;
    canvas.height = 1684;
    
    // Calculate first EMI date (one month from start date)
    const emiDate = new Date(loanDetails.startDate);
    emiDate.setMonth(emiDate.getMonth() + 1);
    const formattedEmiDate = emiDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    
    // Load and draw background image
    const img = new Image();
    img.onload = async () => {
      // Ensure Roboto font is loaded before drawing
      await document.fonts.ready;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw Date
      ctx.font = 'bold 36px "Roboto"';  // Scale: 36px
      ctx.fillStyle = '#8B0000';     // Hex: #8B0000 (Dark Red)
      const dateText = `Date: ${new Date(loanDetails.startDate).toLocaleDateString('en-IN')}`;
      ctx.fillText(dateText, 840, 380);
      
      // Draw certificate paragraph text
      ctx.font = 'bold 32px "Roboto"';  // Scale: 32px
      ctx.fillStyle = '#8B0000';     // Hex: #8B0000 (Dark Red)
      ctx.textAlign = 'center';
      
      // Draw "Dear Name" line
      ctx.fillText(`Dear, ${loanDetails.name}`, canvas.width / 2, 500);
      
      // Draw Certificate title
      ctx.font = 'bold 36px "Roboto"';  // Scale: 36px
      ctx.fillStyle = '#8B0000';     // Hex: #8B0000 (Dark Red)
      ctx.fillText('Certificate of Approved Loan No. IDHADEL09559485', canvas.width / 2, 580);
      
      // Draw paragraph text
      ctx.font = '28px "Roboto"';  // Scale: 28px
      ctx.fillStyle = '#000000';   // Hex: #000000 (Black)
      
      // Break the paragraph into multiple lines
      const lineHeight = 40;
      let y = 660;
      
      ctx.fillText('We acknowledge the receipt of minimal documentation from your end, and we', canvas.width / 2, y);
      y += lineHeight;
      ctx.fillText('sincerely appreciate your choice of Dhani Finance as your financial partner.', canvas.width / 2, y);
      y += lineHeight;
      ctx.fillText('With reference to your recent loan application, we are pleased to extend to you', canvas.width / 2, y);
      y += lineHeight;
      ctx.fillText('the following loan offer, subject to the specified terms and conditions, with the', canvas.width / 2, y);
      y += lineHeight;
      ctx.fillText('first Equated Monthly installment (EMI) scheduled for :', canvas.width / 2, y);
      
      // Draw EMI date with emphasis
      y += lineHeight + 10;
      ctx.font = 'bold 32px "Roboto"';  // Scale: 32px
      ctx.fillStyle = '#8B0000';     // Hex: #8B0000 (Dark Red)
      ctx.fillText(formattedEmiDate, canvas.width / 2, y);
      
      // Add 6 rounded cards below the EMI date
      y += lineHeight + 40;
      
      // Calculate monthly payment
      const monthlyRate = loanDetails.annualInterestRate / 12 / 100;
      const numberOfPayments = loanDetails.loanPeriodYears * 12;
      const monthlyPayment = (loanDetails.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      // Calculate total interest
      const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
      
      // Calculate processing fee (1.38% of loan amount)
      // const processingFee = Math.round(loanDetails.loanAmount * 0.0138);
      
      // With this:
      // Use the user-defined processing fee
      const processingFee = loanDetails.processingFee;
      
      // Card dimensions and layout
      const cardWidth = 300;
      const cardHeight = 120;
      const cardSpacing = 30;
      const cardsPerRow = 3;
      const cornerRadius = 15;
      
      // Card data
      const cards = [
        {
          title: "Approved Loan Amount",
          value: `₹ ${formatIndianNumber(loanDetails.loanAmount)}`
        },
        {
          title: "Interest Rate",
          value: `${loanDetails.annualInterestRate}%`
        },
        {
          title: "Loan Term",
          value: `${loanDetails.loanPeriodYears * 12} Months`
        },
        {
          title: "Monthly Payment (EMI)",
          value: `₹ ${formatIndianNumber(Math.round(monthlyPayment))}`
        },
        {
          title: "Total Interest Payable",
          value: `₹ ${formatIndianNumber(totalInterest)}`
        },
        {
          title: "One Time Processing Fees",
          value: `₹ ${formatIndianNumber(processingFee)}`
        }
      ];
      
      // Draw cards
      for (let i = 0; i < cards.length; i++) {
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;
        
        const cardX = (canvas.width - (cardWidth * cardsPerRow + cardSpacing * (cardsPerRow - 1))) / 2 + col * (cardWidth + cardSpacing);
        const cardY = y + row * (cardHeight + cardSpacing);
        
        // Draw rounded rectangle for card
        ctx.beginPath();
        ctx.moveTo(cardX + cornerRadius, cardY);
        ctx.lineTo(cardX + cardWidth - cornerRadius, cardY);
        ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + cornerRadius);
        ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cornerRadius);
        ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - cornerRadius, cardY + cardHeight);
        ctx.lineTo(cardX + cornerRadius, cardY + cardHeight);
        ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - cornerRadius);
        ctx.lineTo(cardX, cardY + cornerRadius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + cornerRadius, cardY);
        ctx.closePath();
        
        // Fill card with dark red color
        ctx.fillStyle = '#8B0000';
        ctx.fill();
        
        // Draw card title
        ctx.font = 'bold 20px "Roboto"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(cards[i].title, cardX + cardWidth / 2, cardY + 35);
        
        // Draw card value
        ctx.font = 'bold 24px "Roboto"';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(cards[i].value, cardX + cardWidth / 2, cardY + 80);
      }
      
      // Add the director and thank you text at the bottom
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8B0000';
      let footerY = y + (Math.ceil(cards.length / cardsPerRow)) * (cardHeight + cardSpacing) + 200; // Increased from 80 to 200 to move down
      
      ctx.font = 'bold 20px "Roboto"';
      ctx.fillText("Our director Mr. Sanjeev Kashyap", canvas.width - 100, footerY);
      
      footerY += 30; // Reduced from 50 to 30 for tighter spacing
      ctx.fillText("Thank You for choosing us", canvas.width - 100, footerY);
      
      footerY += 30; // Reduced from 50 to 30 for tighter spacing
      ctx.fillText(`${loanDetails.name}`, canvas.width - 100, footerY);
      
      // Load and draw the approved stamp image
      const approvedImg = new Image();
      approvedImg.onload = () => {
        // Save the current context state
        ctx.save();
        
        // Move to the position where we want to draw the image
        ctx.translate(200, 1480);
        
        // Apply rotation (convert degrees to radians)
        ctx.rotate(-15 * Math.PI / 180);
        
        // Apply scaling
        ctx.scale(0.4, 0.4);
        
        // Draw the image centered at the origin point
        ctx.drawImage(approvedImg, -approvedImg.width / 2, -approvedImg.height / 2);
        
        // Restore the context state
        ctx.restore();
      };
      approvedImg.src = '/approved.png';
      
      // Load and draw the stamp image
      const stampImg = new Image();
      stampImg.onload = () => {
        ctx.save();
        ctx.translate(600, 1480);
        ctx.rotate(+16 * Math.PI / 180);
        ctx.scale(0.5, 0.5);
        ctx.drawImage(stampImg, -stampImg.width / 2, -stampImg.height / 2);
        ctx.restore();
      };
      stampImg.src = '/stamp.png';
      
      // Load and draw the signature image
      const signatureImg = new Image();
      signatureImg.onload = () => {
        ctx.save();
        ctx.translate(950, 1480);
        ctx.rotate(-15 * Math.PI / 180);
        ctx.scale(0.2, 0.2);
        ctx.drawImage(signatureImg, -signatureImg.width / 2, -signatureImg.height / 2);
        ctx.restore();
      };
      signatureImg.src = '/signature.png';
    };
    img.src = '/certificate_bg.png';
  };

  // Use effect to draw certificate when canvas is shown
  React.useEffect(() => {
    if (showCertificate) {
      drawCertificate();
    }
  }, [showCertificate, loanDetails]);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {!showCertificate ? (
          <>
            <div className="flex justify-end gap-4 mb-4">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
              >
                <Download size={20} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleViewCertificate}
                className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
              >
                <span>View Certificate</span>
              </button>
            </div>

            <div ref={contentRef}>
              <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                  <img src="/dmi_dhani_logo.png" alt="DMI Finance Logo" className="w-full h-24 object-contain" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#8B0000] rounded-lg p-6 text-white">
                    <h2 className="text-2xl font-bold mb-4">Loan Values</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label htmlFor="loanAmount" className="text-xl font-bold">Loan Amount</label>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium mb-1 text-white text-right">
                            ( {numberToWords(loanDetails.loanAmount)} )
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="text-xl mr-1">₹</span>
                            <input
                              type="text"
                              id="loanAmount"
                              name="loanAmount"
                              value={formatIndianNumber(loanDetails.loanAmount)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                handleInputChange({ target: { name: 'loanAmount', value } });
                              }}
                              className="w-32 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
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
                          className="w-40 bg-transparent text-white text-xl font-bold focus:outline-none text-right"
                          style={{ 
                            color: "white",
                            colorScheme: "dark"
                          }}
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
                        <div className="flex items-center">
                          <span>₹ {formatIndianNumber(schedule[0]?.payment)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xl font-bold">
                        <span>Number Of Payments</span>
                        <span>{schedule.length}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Interest</span>
                        <div className="flex items-center">
                          <span>₹ {formatIndianNumber(totalInterest)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Cost Of Loan</span>
                        <div className="flex items-center">
                          <span>₹ {formatIndianNumber(totalCost)}</span>
                        </div>
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
                          <tr key={payment.paymentNo} className={index % 2 === 0 ? 'bg-red-200' : 'bg-blue-200'}>
                            <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-center">
                              {String(payment.paymentNo).padStart(2, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                              {payment.paymentDate}
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
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex gap-4">
              <button
                onClick={handleDownloadCertificate}
                className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
              >
                <Download size={20} />
                <span>Download Certificate</span>
              </button>
              <button
                onClick={handleBackToLoanDetails}
                className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#6B0000] transition-colors"
              >
                <span>Back to Loan Details</span>
              </button>
            </div>
            <canvas ref={certificateCanvasRef} className="border shadow-lg max-w-full" />
            
            {/* Processing Fee Input Box */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md w-full max-w-md">
              <div className="flex items-center justify-between">
                <label htmlFor="processingFee" className="text-xl font-bold text-[#8B0000]">
                  Processing Fee:
                </label>
                <div className="flex items-center">
                  <span className="text-xl mr-1">₹</span>
                  <input
                    type="text"
                    id="processingFee"
                    name="processingFee"
                    value={formatIndianNumber(loanDetails.processingFee)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                      handleInputChange({ target: { name: 'processingFee', value } });
                    }}
                    className="w-32 border border-gray-300 rounded px-2 py-1 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8B0000] text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;