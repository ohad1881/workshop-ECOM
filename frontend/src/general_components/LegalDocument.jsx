import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const renderText = (text) =>
  typeof text === 'string'
    ? text
    : text.map((part, i) =>
        part.to ? (
          <Link key={i} component={RouterLink} to={part.to} underline="hover">
            {part.label}
          </Link>
        ) : (
          part
        ),
      );

const LegalDocument = ({ title, lastUpdated, intro, sections }) => (
  <Box sx={{ maxWidth: 820, mx: 'auto' }}>
    <Typography variant="h1" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
      Last updated: {lastUpdated}
    </Typography>

    {intro?.map((paragraph, i) => (
      <Typography key={i} variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
        {renderText(paragraph)}
      </Typography>
    ))}

    {sections.map((section, i) => (
      <Box key={section.title} sx={{ mt: 4 }}>
        <Typography variant="h3" sx={{ mb: 1.5 }}>
          {i + 1}. {section.title}
        </Typography>

        {section.paragraphs?.map((paragraph, j) => (
          <Typography key={j} variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {renderText(paragraph)}
          </Typography>
        ))}

        {section.bullets && (
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {section.bullets.map((bullet, j) => (
              <Typography
                key={j}
                component="li"
                variant="body1"
                sx={{ mb: 0.5, lineHeight: 1.7 }}
              >
                {renderText(bullet)}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    ))}
  </Box>
);

export default LegalDocument;
