import { mailer } from '../integrations/mailer.js';
import { emailTemplates } from '../templates/email/index.js';
import { settingsService } from './settings.service.js';

export const emailService = {
  /**
   * Renders a named template and sends it.
   * @param {keyof typeof emailTemplates} template
   */
  async send(template, to, data = {}) {
    const render = emailTemplates[template];
    if (!render) throw new Error(`Unknown email template "${template}"`);
    const { storeName } = await settingsService.get();
    const { subject, html, text } = render({ storeName, ...data });
    return mailer.send({ to, subject, html, text });
  },
};
