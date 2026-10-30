import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Send,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { t } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Textarea,
  Select,
  Button,
} from '../components/ui';

export default function ContactPage({ locale = 'ar' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    budget: '',
    message: '',
    website: '', // honeypot
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errs.name = t('contact.errors.nameRequired', locale);
    }
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errs.email = t('contact.errors.emailInvalid', locale);
    }
    if (!formData.message || formData.message.trim().length < 10) {
      errs.message = t('contact.errors.messageRequired', locale);
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent duplicate in-flight submission
    if (submitting) return;

    // Honeypot check for bots
    if (formData.website) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    // Local mode handling (Plan Audit compliance: mail endpoint active in Phase 07)
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        service: '',
        budget: '',
        message: '',
        website: '',
      });
    }, 250);
  };

  const directChannels = [
    {
      icon: Mail,
      title: t('contact.emailLabel', locale),
      value: t('contact.emailValue', locale),
      href: `mailto:${t('contact.emailValue', locale)}`,
    },
    {
      icon: MapPin,
      title: t('contact.locationLabel', locale),
      value: t('contact.locationValue', locale),
    },
  ];

  const socialLinks = [
    { name: 'Behance', href: 'https://behance.net' },
    { name: 'Dribbble', href: 'https://dribbble.com' },
    { name: 'LinkedIn', href: 'https://linkedin.com' },
    { name: 'Instagram', href: 'https://instagram.com' },
  ];

  return (
    <div className="contact-page">
      {/* Header */}
      <section className="contact-header-section" aria-labelledby="contact-main-title">
        <Container size="site">
          <div className="contact-header-content">
            <span className="contact-badge">{t('nav.contact', locale)}</span>
            <h1 id="contact-main-title" className="contact-title">
              {t('contact.pageTitle', locale)}
            </h1>
            <p className="contact-lead">{t('contact.lead', locale)}</p>
          </div>
        </Container>
      </section>

      {/* Main Content Grid: Direct Channels + Form */}
      <section className="contact-body-section" aria-label="Contact Methods & Inquiry Form">
        <Container size="site">
          <div className="contact-layout-grid">
            {/* Left Column: Direct channels & Information */}
            <aside className="contact-direct-aside">
              <h2 className="direct-section-title">{t('contact.directTitle', locale)}</h2>
              
              <div className="direct-cards-list">
                {directChannels.map((ch, idx) => {
                  const Icon = ch.icon;
                  return (
                    <Card key={idx} className="direct-card">
                      <CardContent className="direct-card-body">
                        <div className="direct-icon-wrap">
                          <Icon size={20} aria-hidden="true" />
                        </div>
                        <div className="direct-info">
                          <span className="direct-label">{ch.title}</span>
                          {ch.href ? (
                            <a href={ch.href} className="direct-value-link">
                              {ch.value}
                            </a>
                          ) : (
                            <span className="direct-value">{ch.value}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Social Channels */}
              <div className="direct-social-wrap">
                <span className="direct-label">{t('footer.social', locale)}</span>
                <div className="direct-social-pills">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="direct-social-link"
                    >
                      <span>{s.name}</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Column: Inquiry Form */}
            <div className="contact-form-col">
              <Card className="contact-form-card">
                <CardHeader>
                  <CardTitle as="h2">{t('contact.formTitle', locale)}</CardTitle>
                  <div className="local-notice-box" role="status">
                    <Info size={16} aria-hidden="true" />
                    <span>{t('contact.localNotice', locale)}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  {submitted ? (
                    <div className="contact-success-state" role="alert">
                      <CheckCircle2 size={40} className="success-icon" aria-hidden="true" />
                      <p className="success-msg">{t('contact.localSuccess', locale)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmitted(false)}
                      >
                        {t('contact.submit', locale)}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate className="inquiry-form">
                      {/* Honeypot field for bot protection */}
                      <input
                        type="text"
                        name="website"
                        id="contact-website"
                        value={formData.website}
                        onChange={handleChange}
                        tabIndex="-1"
                        autoComplete="off"
                        style={{ display: 'none' }}
                        aria-hidden="true"
                      />

                      <div className="form-row-2">
                        <Input
                          id="contact-name"
                          name="name"
                          label={t('contact.nameLabel', locale)}
                          value={formData.name}
                          onChange={handleChange}
                          error={errors.name}
                          required
                          disabled={submitting}
                        />

                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          label={t('contact.emailInputLabel', locale)}
                          value={formData.email}
                          onChange={handleChange}
                          error={errors.email}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-row-2">
                        <Select
                          id="contact-service"
                          name="service"
                          label={t('contact.serviceLabel', locale)}
                          value={formData.service}
                          onChange={handleChange}
                          disabled={submitting}
                        >
                          <option value="">{t('contact.serviceSelectPlaceholder', locale)}</option>
                          <option value="branding">{t('contact.serviceBranding', locale)}</option>
                          <option value="packaging">{t('contact.servicePackaging', locale)}</option>
                          <option value="editorial">{t('contact.serviceEditorial', locale)}</option>
                          <option value="digital">{t('contact.serviceDigital', locale)}</option>
                          <option value="other">{t('contact.serviceOther', locale)}</option>
                        </Select>

                        <Select
                          id="contact-budget"
                          name="budget"
                          label={t('contact.budgetLabel', locale)}
                          value={formData.budget}
                          onChange={handleChange}
                          disabled={submitting}
                        >
                          <option value="">{t('contact.budgetSelectPlaceholder', locale)}</option>
                          <option value="tier1">{t('contact.budget1', locale)}</option>
                          <option value="tier2">{t('contact.budget2', locale)}</option>
                          <option value="tier3">{t('contact.budget3', locale)}</option>
                          <option value="tier4">{t('contact.budget4', locale)}</option>
                        </Select>
                      </div>

                      <Textarea
                        id="contact-message"
                        name="message"
                        label={t('contact.messageLabel', locale)}
                        placeholder={t('contact.messagePlaceholder', locale)}
                        value={formData.message}
                        onChange={handleChange}
                        error={errors.message}
                        rows={5}
                        required
                        disabled={submitting}
                      />

                      <div className="form-submit-row">
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          loading={submitting}
                          disabled={submitting}
                        >
                          <Send size={18} aria-hidden="true" />
                          <span>
                            {submitting
                              ? t('contact.submitting', locale)
                              : t('contact.submit', locale)}
                          </span>
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
