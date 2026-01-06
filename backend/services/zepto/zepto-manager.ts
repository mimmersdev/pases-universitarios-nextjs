import { SendMailClient, TemplateBatchParams } from "zeptomail";

const client = new SendMailClient({
    url: process.env.ZEPTOMAIL_URL!,
    token: process.env.ZEPTOMAIL_TOKEN!,
});

export class ZeptoManager {
    public static async sendTestEmail(data: {
        email: string;
        name: string;
        install_url: string;
    }[]): Promise<void> {
        try {
            const options: TemplateBatchParams = {
                from: {
                    address: process.env.ZEPTOMAIL_FROM_ADDRESS!,
                    name: process.env.ZEPTOMAIL_FROM_NAME!,
                },
                to: data.map(d => ({
                    email_address: {
                        address: d.email,
                        name: d.email,
                    },
                    merge_info: {
                        user_name: d.name,
                        install_url: d.install_url,
                    },
                })),
                mail_template_key: "2d6f.493a40309dc0d638.k1.25ba0dd0-cdaa-11f0-822d-2640018fa9ad.19ad3268f2d",
            }
            const result = await client.mailBatchWithTemplate(options);
            console.log(result);
        } catch (error) {
            console.log(error);
            console.error('Error sending test email:', error);
        }
    }
}