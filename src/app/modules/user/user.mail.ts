import config from "../../../config";


export const OtpHtml = (otp: number) => {
  return `
   <div style="text-align: center; padding: 20px;">
     <h1>Welcome to Our Service!</h1>
     <p>Your OTP is: <strong>${otp}</strong></p>
     <p>Please enter this code to verify your email address.</p>
     <p>Thank you for joining us!</p>
     <p>Best regards,</p>
     <p>${config.site_name} Team</p>
   </div>
   `;
};

// export const ApprovedMailTemp = (payload: {
//   status: VerificationStatus;
//   name: string;
//   partnerCode: string
// }) => {
//   return `
//    <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <title>Partner Status Notification</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f8f8f8;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         max-width: 600px;
//         margin: 40px auto;
//         background-color: #ffffff;
//         border-radius: 8px;
//         box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
//         padding: 20px;
//       }
//       .header {
//         background-color: #007bff;
//         color: #ffffff;
//         padding: 16px;
//         border-radius: 8px 8px 0 0;
//         text-align: center;
//       }
//       .status {
//         font-size: 18px;
//         font-weight: bold;
//         color: #333;
//       }
//       .approved {
//         color: #28a745;
//       }
//       .content {
//         padding: 20px;
//         color: #555;
//         line-height: 1.6;
//       }
//       .footer {
//         padding: 20px;
//         text-align: center;
//         color: #999;
//         font-size: 12px;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2>Partner Application Update</h2>
//       </div>
//       <div class="content">
//         <p>Hi <strong>${payload.name}</strong>,</p>

//         <p>
//           We wanted to update you on the status of your partner application with us.
//         </p>

//         <p class="status approved">
//           Your partner status is: <span>${payload.status}</span> <br />
//           Your partner Partner Code is: <span>${payload.partnerCode}</span>
//         </p>

//         <p>
//           🎉 Congratulations! Your partner application has been approved. You can now access your partner dashboard and begin using our services.
//         </p>

//         <p>Thank you for your interest in working with us!</p>

//         <p>Best regards,<br />${config.site_name} Team</p>
//       </div>
//       <div class="footer">
//         &copy; ${new Date().getFullYear()} ${
//     config.site_name
//   }. All rights reserved.
//       </div>
//     </div>
//   </body>
// </html>

//    `;
// };

// export const RejectedMailTemp = (payload: {
//   status: VerificationStatus,
//   name: string
// }) => {
//   return `
//    <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <title>Partner Status Notification</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f8f8f8;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         max-width: 600px;
//         margin: 40px auto;
//         background-color: #ffffff;
//         border-radius: 8px;
//         box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
//         padding: 20px;
//       }
//       .header {
//         background-color: #007bff;
//         color: #ffffff;
//         padding: 16px;
//         border-radius: 8px 8px 0 0;
//         text-align: center;
//       }
//       .status {
//         font-size: 18px;
//         font-weight: bold;
//         color: #333;
//       }
//       .rejected {
//         color: #dc3545;
//       }
//       .content {
//         padding: 20px;
//         color: #555;
//         line-height: 1.6;
//       }
//       .footer {
//         padding: 20px;
//         text-align: center;
//         color: #999;
//         font-size: 12px;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2>Partner Application Update</h2>
//       </div>
//       <div class="content">
//         <p>Hi <strong>${payload.name}</strong>,</p>

//         <p>
//           We wanted to update you on the status of your partner application with us.
//         </p>

//         <p class="status approved">
//           Your partner status is: <span>${payload.status}</span>
//         </p>

//        <p>
//           Unfortunately, your partner application was not approved at this time. If you believe this was a mistake or would like to reapply, feel free to contact us. ${config.contact_mail}
//         </p>

//         <p>Thank you for your interest in working with us!</p>

//         <p>Best regards,<br />${config.site_name} Team</p>
//       </div>
//       <div class="footer">
//         &copy; ${new Date().getFullYear()} ${
//     config.site_name
//   }. All rights reserved.
//       </div>
//     </div>
//   </body>
// </html>

//    `;
// };