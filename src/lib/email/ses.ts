import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL!,
    Destination: { ToAddresses: [process.env.CONTACT_RECIPIENT_EMAIL!] },
    ReplyToAddresses: [data.email],
    Message: {
      Subject: { Data: `Contact Form: ${data.subject || 'New Enquiry'}` },
      Body: {
        Text: {
          Data: `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject || 'N/A'}\n\nMessage:\n${data.message}`,
        },
      },
    },
  });
  await ses.send(command);
}
