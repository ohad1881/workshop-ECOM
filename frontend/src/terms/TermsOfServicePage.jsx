import LegalDocument from '../general_components/LegalDocument';

const LAST_UPDATED = '26 June 2026';

const intro = [
  'Welcome to GiftGraph. These Terms of Service ("Terms") govern your access to and use of the GiftGraph website and services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Service.',
  'These Terms are governed by the laws of the State of Israel and constitute a binding agreement between you and GiftGraph.',
];

const sections = [
  {
    title: 'Eligibility',
    paragraphs: [
      'You must be at least 18 years of age and legally competent to enter into a binding agreement in order to use the Service. By using the Service you represent and warrant that you meet these requirements.',
    ],
  },
  {
    title: 'Accounts and Registration',
    paragraphs: [
      'Certain features require you to create an account. You agree to provide accurate and complete information and to keep it up to date. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately of any unauthorised use.',
    ],
  },
  {
    title: 'Use of the Service',
    paragraphs: ['When using the Service, you agree not to:'],
    bullets: [
      'Use the Service for any unlawful purpose or in violation of these Terms or applicable law.',
      'Upload or transmit content that is infringing, defamatory, offensive, or otherwise harmful.',
      'Attempt to gain unauthorised access to the Service, other accounts, or our systems.',
      'Interfere with or disrupt the integrity or performance of the Service.',
      'Use automated means to access or collect data from the Service without our prior written consent.',
    ],
  },
  {
    title: 'AI-Generated Recommendations',
    paragraphs: [
      'The Service uses artificial intelligence to generate gift suggestions and related content. Such recommendations are provided for convenience only, may be inaccurate or incomplete, and do not constitute professional advice. You are solely responsible for any decision made based on them.',
    ],
  },
  {
    title: 'User Content',
    paragraphs: [
      'You retain ownership of content you submit to the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free licence to host, store, display and use it to the extent necessary to operate and provide the Service. You represent that you have the rights necessary to grant this licence.',
    ],
  },
  {
    title: 'Intellectual Property',
    paragraphs: [
      'The Service, including its design, software, text, graphics and trademarks, is owned by GiftGraph or its licensors and is protected by applicable intellectual property laws. Except as expressly permitted, you may not copy, modify, distribute or create derivative works from any part of the Service.',
    ],
  },
  {
    title: 'Third-Party Products and Links',
    paragraphs: [
      'The Service may reference or link to third-party products, merchants or websites. We do not control and are not responsible for third-party content, products or services, and any dealings with them are solely between you and the relevant third party.',
    ],
  },
  {
    title: 'Disclaimer of Warranties',
    paragraphs: [
      'The Service is provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied, to the maximum extent permitted by law. We do not warrant that the Service will be uninterrupted, error-free or secure, or that any gift recommendation will meet your expectations.',
    ],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, GiftGraph shall not be liable for any indirect, incidental, special or consequential damages, or for any loss of data, profits or goodwill, arising from or relating to your use of the Service. Nothing in these Terms limits liability that cannot be excluded under the laws of the State of Israel.',
    ],
  },
  {
    title: 'Indemnification',
    paragraphs: [
      'You agree to indemnify and hold harmless GiftGraph and its officers, employees and agents from any claim, demand, loss or expense (including reasonable legal fees) arising from your use of the Service, your User Content, or your breach of these Terms or of applicable law.',
    ],
  },
  {
    title: 'Termination',
    paragraphs: [
      'We may suspend or terminate your access to the Service at any time, with or without notice, if you breach these Terms or if we discontinue the Service. You may stop using the Service and close your account at any time. Provisions that by their nature should survive termination shall continue to apply.',
    ],
  },
  {
    title: 'Changes to these Terms',
    paragraphs: [
      'We may amend these Terms from time to time. Material changes will be notified through the Service or by other appropriate means, and the "Last updated" date above will be revised. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.',
    ],
  },
  {
    title: 'Governing Law and Jurisdiction',
    paragraphs: [
      'These Terms are governed by and construed in accordance with the laws of the State of Israel, without regard to its conflict-of-law rules. The competent courts of the Tel Aviv–Jaffa district shall have exclusive jurisdiction over any dispute arising from or relating to these Terms or the Service.',
    ],
  },
  {
    title: 'Contact Us',
    paragraphs: [
      [
        'For any question regarding these Terms, you may contact us at support@giftgraph.example. Please also review our ',
        { to: '/privacy', label: 'Privacy Policy' },
        '.',
      ],
    ],
  },
];

const TermsOfServicePage = () => (
  <LegalDocument
    title="Terms of Service"
    lastUpdated={LAST_UPDATED}
    intro={intro}
    sections={sections}
  />
);

export default TermsOfServicePage;
