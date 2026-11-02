# Phase 09 production smoke preparation (09.07)

No production URL or staging host has been supplied, so no live smoke test has run. `infrastructure/deployment/smoke-readonly.sh --plan https://example.invalid` lists read-only routes; `--run` makes HTTPS GET requests, checks certificate validation through curl, and checks Arabic/English SSR `lang` markers. It does not authenticate, submit contact, upload media, or mutate data.

The complete canonical 09.07 acceptance test must be performed only after an approved staging release and then an authorized production deployment. Record HTTP status, locale, rendered HTML source, project detail links, authenticated admin flow, a contact message to an owner-approved test recipient, Cloudinary image delivery, sitemap/robots contents, HTTPS redirect and certificate chain. Use disposable accounts and test content, and record the result without credentials or personal data. The frontend freeze makes SSR and browser defects reportable but not fixable in this scope.

Do not mark 09.07 DONE based on the local `--plan` check or the partial read-only script. CI/security, deployment, DNS, provider and owner approval gates still apply.
