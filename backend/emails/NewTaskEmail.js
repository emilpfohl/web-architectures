const { Heading, Text, Button } = require('@react-email/components');
const { EmailLayout, e } = require('./layout');

function NewTaskEmail({ creatorName, taskTitle, chatUrl }) {
  return e(EmailLayout, null,
    e(Heading, { style: { fontSize: '22px' } }, `Neue Aufgabe: "${taskTitle}"`),
    e(Text, null, `${creatorName} hat eine neue Aufgabe für die WG erstellt: "${taskTitle}".`),
    e(Text, null, 'Schau vorbei und übernimm sie, wenn du Zeit hast.'),
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

module.exports = NewTaskEmail;
