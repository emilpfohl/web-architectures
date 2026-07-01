const { Heading, Text, Button } = require('@react-email/components');
const { EmailLayout, e } = require('./layout');

function NewMemberEmail({ newMemberName, wgName, chatUrl }) {
  return e(EmailLayout, null,
    e(Heading, { style: { fontSize: '22px' } }, `${newMemberName} ist der WG "${wgName}" beigetreten`),
    e(Text, null, `${newMemberName} ist ab sofort Teil eurer WG.`),
    e(Text, null, `Sag doch kurz Hallo und begrüße ${newMemberName} im Chat!`),
    e(Button, {
      href: chatUrl,
      style: {
        backgroundColor: '#4b6c53',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '999px',
        fontWeight: 'bold',
        textDecoration: 'none'
      }
    }, 'Zum Chat')
  );
}

module.exports = NewMemberEmail;
