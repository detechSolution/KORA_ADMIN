export type MailStatus = "draft" | "sent" | "failed" | string;

export type Mail = {
  id: number;
  subject?: string | null;
  title?: string | null;
  htmlContent?: string | null;
  html_content?: string | null;
  recipientsEmails?: string[] | null;
  recipient_emails?: string[] | null;
  recipient_count?: number | null;
  status?: MailStatus | null;
  created_at?: string | null;
  updated_at?: string | null;
  sent_at?: string | null;
};
