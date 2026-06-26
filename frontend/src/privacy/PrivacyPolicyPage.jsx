import LegalDocument from '../general_components/LegalDocument';

const LAST_UPDATED = '26 June 2026';

const intro = [
  'GiftGraph ("GiftGraph", "we", "us" or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, share and protect information about you when you use our website and services (the "Service").',
  'This Policy is drafted in accordance with the Protection of Privacy Law, 5741-1981 and the regulations enacted thereunder, as in force in the State of Israel. By using the Service you confirm that you have read and understood this Policy.',
];

const sections = [
  {
    title: 'Information We Collect',
    paragraphs: ['We collect the following categories of information:'],
    bullets: [
      'Information you provide directly — such as your name, email address, password, profile details, wishlists, gift preferences and any content you submit.',
      'Information collected automatically — such as your IP address, device and browser type, pages viewed, and usage patterns, collected through cookies and similar technologies.',
      'Information from your activity — gift searches, AI recommendation requests, and interactions with other users on the Service.',
    ],
  },
  {
    title: 'Purposes of Use',
    paragraphs: ['We use your information for the following purposes:'],
    bullets: [
      'To provide, operate and maintain the Service and your account.',
      'To generate personalised gift recommendations, including through automated and AI-based processing.',
      'To communicate with you regarding your account, support requests and service updates.',
      'To improve, analyse and secure the Service and to prevent fraud or misuse.',
      'To comply with legal obligations applicable to us.',
    ],
  },
  {
    title: 'Legal Basis and Consent',
    paragraphs: [
      'You are not legally obligated to provide us with information, and any provision of information depends on your free will and consent. However, certain information is required in order to use core features of the Service, and without it we may be unable to provide them.',
    ],
  },
  {
    title: 'Sharing Information with Third Parties',
    paragraphs: [
      'We do not sell your personal information. We may share information with third parties only in the following circumstances:',
    ],
    bullets: [
      'With service providers who process data on our behalf (such as hosting, analytics and AI infrastructure providers), subject to appropriate confidentiality and security obligations.',
      'With other users, to the extent you choose to make profile or wishlist information public.',
      'Where required by law, court order, or a competent authority, or to protect our rights, property or safety or those of others.',
      'In connection with a merger, acquisition or transfer of all or part of our business, subject to the terms of this Policy.',
    ],
  },
  {
    title: 'Data Security',
    paragraphs: [
      'We implement accepted technical and organisational measures to protect your information against unauthorised access, alteration, disclosure or destruction, including encryption of data in transit and access controls. No system, however, is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    title: 'Data Retention',
    paragraphs: [
      'We retain your information for as long as your account is active and for such additional period as is necessary to fulfil the purposes described in this Policy or to comply with legal, accounting or reporting obligations. When information is no longer required, we will delete or anonymise it.',
    ],
  },
  {
    title: 'Your Rights',
    paragraphs: [
      'In accordance with the Protection of Privacy Law, 5741-1981, you have the right to review the information held about you in our database and to request that inaccurate, incomplete or outdated information be corrected or deleted. You may also withdraw your consent to receive marketing communications at any time. To exercise these rights, please contact us using the details below.',
    ],
  },
  {
    title: 'Cookies',
    paragraphs: [
      'We use cookies and similar technologies to operate the Service, remember your preferences, and analyse usage. You may configure your browser to refuse cookies, but some features of the Service may not function properly as a result.',
    ],
  },
  {
    title: 'International Transfers',
    paragraphs: [
      'Some of our service providers may store or process information outside the State of Israel. Where information is transferred abroad, we take steps to ensure it is afforded a level of protection consistent with applicable Israeli law.',
    ],
  },
  {
    title: 'Minors',
    paragraphs: [
      'The Service is not intended for individuals under the age of 18. We do not knowingly collect information from minors. If you believe that a minor has provided us with information, please contact us and we will take appropriate steps to delete it.',
    ],
  },
  {
    title: 'Changes to this Policy',
    paragraphs: [
      'We may update this Policy from time to time. Material changes will be notified through the Service or by other appropriate means. The "Last updated" date above indicates when the Policy was last revised. Your continued use of the Service after changes take effect constitutes acceptance of the updated Policy.',
    ],
  },
  {
    title: 'Governing Law',
    paragraphs: [
      'This Policy is governed by the laws of the State of Israel. The competent courts of the Tel Aviv–Jaffa district shall have exclusive jurisdiction over any matter arising from or relating to this Policy.',
    ],
  },
  {
    title: 'Contact Us',
    paragraphs: [
      [
        'For any question or request regarding this Policy or your personal information, you may contact us at privacy@giftgraph.example, or review our ',
        { to: '/terms', label: 'Terms of Service' },
        '.',
      ],
    ],
  },
];

const PrivacyPolicyPage = () => (
  <LegalDocument
    title="Privacy Policy"
    lastUpdated={LAST_UPDATED}
    intro={intro}
    sections={sections}
  />
);

export default PrivacyPolicyPage;
