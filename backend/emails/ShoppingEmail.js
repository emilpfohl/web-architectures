const { Heading, Text, Button } = require('@react-email/components');
const { EmailLayout, e } = require('./layout');

function ShoppingEmail({ shopperName, chatUrl }) {
  return e(EmailLayout, null,
    e(Heading, { style: { fontSize: '22px' } }, `${shopperName} ist einkaufen`),
    e(Text, null, `${shopperName} ist gerade unterwegs zum Einkaufen.`),
    e(Text, null, 'Falls dir noch etwas fehlt, sag kurz im Chat Bescheid, bevor die Einkaufsliste abgehakt wird.'),
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

module.exports = ShoppingEmail;
