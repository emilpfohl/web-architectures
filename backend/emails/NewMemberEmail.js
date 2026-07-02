const { Heading, Text, Button } = require('@react-email/components');
const { EmailLayout, e, COLORS, FONT_HEADLINE } = require('./layout');

function NewMemberEmail({ newMemberName, wgName, actionUrl }) {
  return e(EmailLayout, { wgName },
    e(Heading, { style: { fontFamily: FONT_HEADLINE, fontSize: '22px', color: COLORS.onSurface, margin: '0 0 12px' } },
      `${newMemberName} ist der WG "${wgName}" beigetreten`),
    e(Text, { style: { color: COLORS.onSurface, fontSize: '15px', lineHeight: '22px', margin: '0 0 8px' } },
      `${newMemberName} ist ab sofort Teil eurer WG.`),
    e(Text, { style: { color: COLORS.onSurfaceVariant, fontSize: '15px', lineHeight: '22px', margin: '0 0 24px' } },
      `Sag doch kurz Hallo und begrüße ${newMemberName} im Chat!`),
    e(Button, {
      href: actionUrl,
      style: {
        backgroundColor: COLORS.primary,
        color: COLORS.onPrimary,
        padding: '12px 24px',
        borderRadius: '9999px',
        fontFamily: FONT_HEADLINE,
        fontWeight: 700,
        fontSize: '14px',
        textDecoration: 'none'
      }
    }, 'Zum Chat')
  );
}

module.exports = NewMemberEmail;
