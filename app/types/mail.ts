type MailStatus = "draft" | "sent" | "failed" | string;

export type Mail = {
  id: number;
  subject: string | null;
  title: string | null;
  htmlContent: string | null;
  recipientsEmails: string[] | null;
  recipientCount: number | null;
  status: MailStatus | null;
  createdAt: string | null;
  updatedAt: string | null;
  sentAt: string | null;
};
