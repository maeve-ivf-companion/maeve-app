// Starter legal documents for Maeve. English is the source of truth and defines
// the LegalContent type; fr.ts must mirror its exact shape.
//
// IMPORTANT: these are a drafting starting point, not lawyer-reviewed text. They
// describe what the app actually does today so that counsel has something
// concrete to red-line. See the roadmap in HANDOFF.md. Do not remove the draft
// banner until a lawyer has signed the text off.

export type LegalDoc = {
  title: string;
  updated: string;
  draftNotice: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  contact: string;
};

export type LegalContent = {
  terms: LegalDoc;
  privacy: LegalDoc;
};

export const legalEn: LegalContent = {
  terms: {
    title: "Terms of Service",
    updated: "Last updated: July 15, 2026",
    draftNotice:
      "This is a draft pending legal review. It describes how Maeve works today and is not yet a final agreement.",
    intro:
      "Maeve is an IVF companion app made by Maman Biomedical Inc. These terms explain what Maeve is, what it is not, and what we each agree to. Please read the section on medical advice carefully. It is the most important one here.",
    sections: [
      {
        heading: "Maeve is not medical advice",
        body: [
          "Maeve is an informational and emotional support tool. It is not a medical device, it is not a clinic, and it does not practise medicine. Nothing in Maeve is a diagnosis, a prescription, or a treatment instruction.",
          "Your fertility clinic is the only source of truth for your care. Never change a dose, a schedule, or a decision based on something Maeve told you. If something feels urgent or wrong, contact your clinic or seek medical care immediately. Do not wait, and do not use Maeve instead.",
          "Anything Maeve shows you about your hormone readings is a plain-language explanation of general patterns, not an assessment of your body or your cycle.",
        ],
      },
      {
        heading: "About the AI features",
        body: [
          "Some parts of Maeve use artificial intelligence, specifically Claude, made by Anthropic. These are the partner brief, the plain-language read on hormone entries, and the what-if answers in the Learn section.",
          "AI can be wrong. It can be confidently wrong. Treat everything it says as a starting point for a conversation with your clinic, never as an answer.",
          "To provide these features, the relevant content you enter is sent to Anthropic to generate a response. See our Privacy Policy for what that means for your data.",
        ],
      },
      {
        heading: "Who can use Maeve",
        body: [
          "You must be at least 18 years old to create an account.",
          "You are responsible for your account and for keeping your password private. Tell us promptly if you think someone else has access to it.",
        ],
      },
      {
        heading: "Your partner and what they see",
        body: [
          "If you connect a partner using an invite code, you control what they see. By default your partner sees the emotional brief you choose to send, and nothing else.",
          "Your hormone readings are never shared with your partner, at any sharing level.",
          "You can change your sharing level or disconnect a partner at any time from your account.",
        ],
      },
      {
        heading: "The community portals",
        body: [
          "Posts you mark as community are visible to other people using Maeve. Posts you mark as private are not.",
          "Please do not post anything that identifies another person, or anything abusive, harassing, or presented as medical advice to others. We may remove posts or accounts that do.",
          "Think before you post to community. Other people going through IVF will read it.",
        ],
      },
      {
        heading: "Your content belongs to you",
        body: [
          "What you write and log in Maeve is yours. We do not claim ownership of it.",
          "You give us permission to store and process it only to the extent needed to run the features you are using, as described in the Privacy Policy.",
        ],
      },
      {
        heading: "Ending your account",
        body: [
          "You can delete your data at any time from the Account tab. Deletion is permanent and we cannot recover it afterwards.",
          "We may suspend or end an account that breaks these terms or puts other people at risk.",
        ],
      },
      {
        heading: "Availability and limits",
        body: [
          "Maeve is provided as-is. We do not guarantee it will always be available, error-free, or uninterrupted, and this is an early-stage product.",
          "To the fullest extent the law allows, Maman Biomedical Inc. is not liable for indirect or consequential losses arising from your use of Maeve. Nothing in these terms limits liability that cannot legally be limited.",
        ],
      },
      {
        heading: "Changes and governing law",
        body: [
          "We may update these terms as Maeve grows. If a change is significant we will tell you in the app before it takes effect.",
          "These terms are governed by the laws of the Province of Nova Scotia and the laws of Canada that apply there.",
        ],
      },
    ],
    contact: "Questions about these terms? Contact Maman Biomedical Inc. at latchmi@mamanbiomedical.ca.",
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: July 15, 2026",
    draftNotice:
      "This is a draft pending legal review. It describes how Maeve handles data today and is not yet a final policy.",
    intro:
      "Maeve holds some of the most sensitive information there is: where you are in fertility treatment, and how you feel about it. This policy explains exactly what we collect, why, who can see it, and how to get it back or delete it. Our guiding rule is minimum viable data. We ask for something only when a feature you are using actually needs it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account details: your email address, and a password you choose. If you sign in with a magic link, we do not store a password at all.",
          "Profile: your display name, your language preference, whether you are the patient or the partner, and optionally your cycle start date.",
          "What you choose to log: hormone readings, scheduled appointments and injections, portal posts, and questions you ask the Learn section.",
          "Consent records: what you agreed to and when, including whether you opted in to messages from Maman Biomedical.",
          "We do not collect advertising identifiers, and we do not track you across other websites.",
        ],
      },
      {
        heading: "Health information",
        body: [
          "Hormone readings and anything you write about your treatment are sensitive personal health information, and we treat them that way.",
          "Your hormone readings are visible only to you. They are never shown to a connected partner, at any sharing level, and they are not shown to other Maeve users.",
        ],
      },
      {
        heading: "What your partner can see",
        body: [
          "If you connect a partner, they see the emotional briefs you send them. That is a short summary written from a mood and an optional note you chose to share.",
          "They do not see your hormone readings. Depending on the sharing level you pick, they may see your schedule. You choose that level and can change it any time.",
          "Nothing is shared with a partner until you connect one using your invite code.",
        ],
      },
      {
        heading: "AI processing",
        body: [
          "Three features use Claude, an AI service from Anthropic: the partner brief, the hormone interpretation, and the Learn what-if answers.",
          "When you use one of those features, the relevant content is sent to Anthropic to generate a response. That means a mood and note for a brief, a hormone value for an interpretation, or your question for a what-if.",
          "We do not send your email address or your name to Anthropic as part of these requests.",
          "If you would rather not have content processed this way, do not use those three features. The rest of Maeve works without them.",
        ],
      },
      {
        heading: "Where your data lives",
        body: [
          "Your data is stored in a Postgres database hosted by Supabase, protected by row-level security rules so that one account cannot read another account's data.",
          "The app is hosted on Vercel.",
          "These providers store data on servers that may be outside Canada. That means it may be subject to the laws of the country it is stored in.",
        ],
      },
      {
        heading: "Messages from us",
        body: [
          "We send you the emails needed to run your account, such as confirming your address or resetting your password. These are not marketing.",
          "We only send marketing or promotional messages from Maman Biomedical if you explicitly opted in. That box is never ticked for you, and skipping it does not limit your use of Maeve.",
          "You can withdraw that consent at any time, and every marketing message includes a way to unsubscribe.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can see and export everything we hold about you from the Account tab, using download my data.",
          "You can delete your data from the Account tab. Deletion is permanent.",
          "You can correct your profile details at any time.",
          "Under Canadian privacy law, including PIPEDA, you have the right to access your personal information and to challenge its accuracy. Contact us if you want to exercise those rights and cannot do it in the app.",
        ],
      },
      {
        heading: "How long we keep things",
        body: [
          "We keep your data while your account exists. When you delete your data, it is removed from the live database.",
          "We keep consent records for as long as we need them to show that we had permission to contact you, which is a legal requirement.",
        ],
      },
      {
        heading: "Children",
        body: [
          "Maeve is not intended for anyone under 18 and we do not knowingly collect information from children.",
        ],
      },
      {
        heading: "Changes to this policy",
        body: [
          "If we change how we handle your data in a way that affects you, we will tell you in the app before the change takes effect, and we will ask for fresh consent where the law requires it.",
        ],
      },
    ],
    contact:
      "Questions, or want to exercise a privacy right? Contact Maman Biomedical Inc. at latchmi@mamanbiomedical.ca.",
  },
};
