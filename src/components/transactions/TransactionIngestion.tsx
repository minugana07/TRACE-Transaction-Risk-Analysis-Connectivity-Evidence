/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * TransactionIngestion - CSV upload & manual transaction entry interfaces
 */

import React, { useState } from 'react';
import { PaymentMethod, TransactionManualInput, Transaction } from '../../contracts/transaction';
import { traceApi } from '../../services/apiClient';
import { useAccessibility } from '../../context/AccessibilityContext';

interface TransactionIngestionProps {
  onTransactionAdded: (newTxn: Transaction) => void;
  onBatchAdded: (count: number) => void;
}

export const TransactionIngestion: React.FC<TransactionIngestionProps> = ({
  onTransactionAdded,
  onBatchAdded
}) => {
  const { highContrast } = useAccessibility();
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  
  // Manual Form State
  const [amount, setAmount] = useState<string>('');
  const [receiverVpa, setReceiverVpa] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // CSV State
  const [csvText, setCsvText] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  const sampleCsvData = `Amount,Receiver,Phone,Method,Note
24999,quick.refund.help@ybl,+919876543210,UPI,Customer care refund authorization fee
8500,telegram.earn.tasks@icici,+919123456789,UPI,VIP level 2 task activation deposit
1450,officer.electricity.board@paytm,+919899887766,UPI,Urgent power bill clearance
320,cornerbistro@okhdfcbank,,UPI,Coffee and sandwich`;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!receiverVpa.trim()) {
      setFormError('Please enter a recipient UPI ID or account number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TransactionManualInput = {
        amount: parsedAmount,
        currency: 'INR',
        receiverAccountOrVpa: receiverVpa.trim(),
        receiverPhone: receiverPhone.trim() || undefined,
        paymentMethod,
        note: note.trim() || 'Direct Transfer',
        senderAccountOrVpa: 'user.protect@okaxis'
      };

      const result = await traceApi.ingestManualTransaction(payload);
      onTransactionAdded(result.transaction);
      
      const isFlagged = result.detectionResult.riskLevel === 'CRITICAL' || result.detectionResult.riskLevel === 'HIGH';
      setSuccessMessage(
        isFlagged
          ? `⚠️ Warning: Transaction ingested! TRACE flagged this as ${result.detectionResult.riskLevel} risk. Check the explanation below.`
          : `✓ Transaction verified and recorded with ${result.detectionResult.riskLevel} risk score.`
      );

      // Reset form
      setAmount('');
      setReceiverVpa('');
      setReceiverPhone('');
      setNote('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to analyze transaction. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvError(null);
    setCsvSuccess(null);

    let contentToParse = csvText;
    if (csvFile) {
      contentToParse = await csvFile.text();
    }

    if (!contentToParse.trim()) {
      setCsvError('Please select a CSV file or paste CSV content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await traceApi.parseAndIngestCsv(contentToParse);
      onBatchAdded(result.parsedCount);
      setCsvSuccess(`Successfully ingested ${result.parsedCount} transactions. ${result.flaggedCount} item(s) flagged for risk.`);
      setCsvText('');
      setCsvFile(null);
    } catch (err: any) {
      setCsvError(err.message || 'Error processing CSV. Please verify column formatting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border ${
      highContrast 
        ? 'bg-black border-2 border-yellow-400 text-white' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold">Check or Ingest Transactions</h2>
          <p className="text-xs opacity-75">Submit a transaction to evaluate risk against TRACE threat intelligence.</p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => setMode('manual')}
            className={`min-h-[36px] px-3 py-1 rounded text-xs font-semibold transition-colors ${
              mode === 'manual'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'csv'}
            onClick={() => setMode('csv')}
            className={`min-h-[36px] px-3 py-1 rounded text-xs font-semibold transition-colors ${
              mode === 'csv'
                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            CSV Upload
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
        <span className="font-bold text-sm">🔒 Safety Reminder:</span>
        <span>Never share or enter your UPI PIN, ATM PIN, or banking passwords. TRACE only analyzes transaction details.</span>
      </div>

      {mode === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="amount-input">
                Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <input
                id="amount-input"
                type="number"
                step="0.01"
                placeholder="e.g. 2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="payment-method-select">
                Payment Method
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="IMPS">IMPS Immediate Transfer</option>
                <option value="NEFT">NEFT National Electronic Funds</option>
                <option value="RTGS">RTGS High-Value Transfer</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="receiver-vpa-input">
                Recipient UPI ID / Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="receiver-vpa-input"
                type="text"
                placeholder="e.g. merchant@okhdfcbank or 9876543210@paytm"
                value={receiverVpa}
                onChange={(e) => setReceiverVpa(e.target.value)}
                required
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="receiver-phone-input">
                Recipient Phone Number (Optional)
              </label>
              <input
                id="receiver-phone-input"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  highContrast 
                    ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                    : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
                }`}
              />
              <span className="text-[11px] opacity-70">Enables cross-checking against CallShield scam records</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="note-input">
              Payment Note / Context
            </label>
            <input
              id="note-input"
              type="text"
              placeholder="e.g. Online purchase refund, electricity bill, job task deposit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                highContrast 
                  ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                  : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
              }`}
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium" role="alert">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium" role="status">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Evaluating Risk...
              </>
            ) : (
              'Ingest & Evaluate Risk'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="csv-file-input">
              Select Statement or CSV File
            </label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="text-center text-xs opacity-60 font-semibold">— OR PASTE CSV DATA DIRECTLY —</div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold" htmlFor="csv-textarea">
                CSV Data
              </label>
              <button
                type="button"
                onClick={() => setCsvText(sampleCsvData)}
                className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                Insert Sample Data
              </button>
            </div>
            <textarea
              id="csv-textarea"
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Amount,Receiver,Phone,Method,Note&#10;2500,store@upi,+919876543210,UPI,Shopping"
              className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 ${
                highContrast 
                  ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-yellow-400' 
                  : 'border-slate-300 dark:border-slate-700 bg-transparent focus:ring-blue-500'
              }`}
            />
          </div>

          {csvError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium" role="alert">
              {csvError}
            </div>
          )}

          {csvSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium" role="status">
              {csvSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isSubmitting ? 'Parsing & Evaluating...' : 'Upload & Process Batch'}
          </button>
        </form>
      )}
    </div>
  );
};
