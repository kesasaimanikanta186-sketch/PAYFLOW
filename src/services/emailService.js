// emailService.js - EmailJS integration for transaction emails
// To use: Sign up at https://www.emailjs.com/ and get your credentials

const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'    // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'     // Replace with your EmailJS public key

export function sendTransactionEmail(transactionData) {
  // transactionData: { to_email, to_name, amount, receiver, transaction_id, status, date_time }

  const templateParams = {
    to_email: transactionData.to_email,
    to_name: transactionData.to_name,
    amount: transactionData.amount,
    receiver_name: transactionData.receiver,
    transaction_id: transactionData.transaction_id,
    status: transactionData.status,
    date_time: transactionData.date_time || new Date().toLocaleString('en-IN')
  }

  // Using fetch to call EmailJS REST API (no library needed)
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    })
  })
    .then(function (response) {
      if (response.ok) {
        console.log('Transaction email sent successfully')
        return true
      }
      console.log('Email sending skipped (configure EmailJS credentials)')
      return false
    })
    .catch(function (error) {
      console.log('Email service not configured:', error.message)
      return false
    })
}

export default sendTransactionEmail
