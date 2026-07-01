const { Heading, Text } = require('@react-email/components');
const { EmailLayout, e } = require('./layout');

function PasswordChangedEmail({ userName }) {
  return e(EmailLayout, null,
    e(Heading, { style: { fontSize: '22px' } }, 'Dein Passwort wurde geändert'),
    e(Text, null, `Hallo ${userName}, dein Passwort wurde soeben erfolgreich geändert.`),
    e(Text, null, 'Falls du das nicht warst, ändere dein Passwort umgehend und kontaktiere die WG-Administration.')
  );
}

module.exports = PasswordChangedEmail;
