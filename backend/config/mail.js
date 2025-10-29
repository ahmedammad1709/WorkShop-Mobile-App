import nodemailer from 'nodemailer';

// Validate required environment variables
function validateEmailConfig() {
  const required = ['SMTP_HOST', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required email environment variables:', missing.join(', '));
    console.error('📝 Please create a .env file with the following variables:');
    console.error('   SMTP_HOST=smtp.gmail.com');
    console.error('   SMTP_PORT=587');
    console.error('   SMTP_SECURE=false');
    console.error('   SMTP_EMAIL=your-email@gmail.com');
    console.error('   SMTP_PASSWORD=your-app-password');
    console.error('   📋 For Gmail setup instructions, see .env.example');
    return false;
  }
  return true;
}

// Only create transporter if config is valid
let transporter = null;

if (validateEmailConfig()) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    // Test the connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        console.error('🔧 Please check your email configuration in .env file');
      } else {
        console.log('✅ SMTP connection verified successfully');
      }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    transporter = null;
  }
} else {
  console.error('❌ Email service disabled due to missing configuration');
}

export default transporter;


