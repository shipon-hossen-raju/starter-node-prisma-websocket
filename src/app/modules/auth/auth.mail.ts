import config from "../../../config";

// unused expiry
export const ForgotOtpHtml = (otp: number, expiry: Date) => {
  return `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset OTP - ${otp}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f7fa;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 480px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
      }
      h2 {
        text-align: center;
        color: #333333;
      }
      p {
        color: #555555;
        font-size: 15px;
        line-height: 1.6;
      }
      .otp-box {
        text-align: center;
        margin: 30px 0;
      }
      .otp-code {
        display: inline-block;
        background: #dc3545;
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
        padding: 14px 28px;
        border-radius: 8px;
        letter-spacing: 6px;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #888888;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>
        We received a request to reset your password. Use the OTP below to
        proceed. This code is valid for the next
        <strong> 10 minutes</strong>.
      </p>

      <div class="otp-box">
        <div class="otp-code"> ${otp} </div>
      </div>

      <p>If you did not request a password reset, please ignore this email.</p>

      <div class="footer">
        &copy; 2025 ${config.site_name}. All rights reserved.
      </div>
    </div>
  </body>
</html>
   `;
};


export const ResendOtpHtml = (otp: number, expiry: Date) => {
   console.log("expiry", expiry.getMinutes());
  return `
   <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resend OTP - ${otp}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f7fa;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 480px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
      }
      h2 {
        text-align: center;
        color: #333333;
      }
      p {
        color: #555555;
        font-size: 15px;
        line-height: 1.6;
      }
      .otp-box {
        text-align: center;
        margin: 30px 0;
      }
      .otp-code {
        display: inline-block;
        background: #28a745;
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
        padding: 14px 28px;
        border-radius: 8px;
        letter-spacing: 6px;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #888888;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Resend OTP</h2>
      <p>Hello,</p>
      <p>
        As requested, here is your OTP to complete the verification. This code is valid for the next
        <strong>10 minutes</strong>.
      </p>

      <div class="otp-box">
        <div class="otp-code"> ${otp} </div>
      </div>

      <p>If you did not request this, please ignore this email.</p>

      <div class="footer">
        &copy; 2025 ${config.site_name}. All rights reserved.
      </div>
    </div>
  </body>
</html>
   `;
};
