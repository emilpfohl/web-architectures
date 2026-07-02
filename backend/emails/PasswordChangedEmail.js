const { Heading, Text } = require('@react-email/components');
const { EmailLayout, e, COLORS, FONT_HEADLINE } = require('./layout');

function PasswordChangedEmail({ userName, wgName }) {
  return e(EmailLayout, { wgName },
    e(Heading, { style: { fontFamily: FONT_HEADLINE, fontSize: '22px', color: COLORS.onSurface, margin: '0 0 12px' } },
      'Dein Passwort wurde geändert'),
    e(Text, { style: { color: COLORS.onSurface, fontSize: '15px', lineHeight: '22px', margin: '0 0 8px' } },
      `Hallo ${userName}, dein Passwort wurde soeben erfolgreich geändert.`),
    e(Text, { style: { color: COLORS.onSurfaceVariant, fontSize: '15px', lineHeight: '22px', margin: 0 } },
      'Falls du das nicht warst, ändere dein Passwort umgehend und kontaktiere die WG-Administration.')
  );
}

module.exports = PasswordChangedEmail;
