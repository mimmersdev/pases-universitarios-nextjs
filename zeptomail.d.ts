// Type declaration for zeptomail package
// This fixes the TypeScript error where types exist but aren't properly exported in package.json
// The package has types but they're not properly exposed in the exports field

/// <reference types="node" />

declare module "zeptomail" {
  // Import types from the actual type definitions
  import type {
    ClientParams,
    Sendmail,
    SendmailBatch,
    TemplateQueryParams,
    TemplateBatchParams,
  } from "zeptomail/lib/js/types/types";

  export interface ClientParams {
    url: string;
    debug?: boolean | undefined;
    domain?: string;
    token: string;
  }

  export interface EmailAddress {
    address: string;
    name: string;
  }

  export interface CcBccItem {
    email_address: EmailAddress;
  }

  export interface MimeHeader {
    [key: string]: string;
  }

  export interface BasicEmailParams {
    from: {
      address: string;
      name: string;
    };
    subject: string;
    reply_to?: EmailAddress[];
    textbody?: string;
    htmlbody?: string;
    cc?: CcBccItem[];
    bcc?: CcBccItem[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: MimeHeader;
    attachments?: Array<{
      name: string;
      mime_type?: string;
      file_cache_key?: string;
      content?: string;
    }>;
    inline_images?: Array<{
      cid: string;
      mime_type?: string;
      file_cache_key?: string;
      content?: string;
    }>;
    merge_info?: {
      [key: string]: string;
    };
  }

  export interface Sendmail extends BasicEmailParams {
    to: CcBccItem[];
  }

  export interface SendmailBatch extends BasicEmailParams {
    to: Array<{
      email_address: EmailAddress;
      merge_info?: {
        [key: string]: string;
      };
    }>;
  }

  export interface TemplateQueryParams {
    from: {
      address: string;
      name: string;
    };
    mail_template_key?: string;
    template_alias?: string;
    template_key?: string;
    reply_to?: EmailAddress[];
    cc?: CcBccItem[];
    bcc?: CcBccItem[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: MimeHeader;
    merge_info?: {
      [key: string]: string;
    };
    to: CcBccItem[];
  }

  export interface TemplateBatchParams {
    from: {
      address: string;
      name: string;
    };
    mail_template_key?: string;
    template_alias?: string;
    template_key?: string;
    reply_to?: EmailAddress[];
    cc?: CcBccItem[];
    bcc?: CcBccItem[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: MimeHeader;
    merge_info?: {
      [key: string]: string;
    };
    to: Array<{
      email_address: EmailAddress;
      merge_info?: {
        [key: string]: string;
      };
    }>;
  }

  export class SendMailClient {
    isUrl: string | boolean;
    constructor(options: ClientParams, clientOption?: {});
    sendMail(options: Sendmail): Promise<unknown>;
    sendBatchMail(options: SendmailBatch): Promise<unknown>;
    sendMailWithTemplate(options: TemplateQueryParams): Promise<unknown>;
    mailBatchWithTemplate(options: TemplateBatchParams): Promise<unknown>;
  }
}

