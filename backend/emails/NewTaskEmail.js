const { Heading, Text, Button } = require('@react-email/components');
const { EmailLayout, e, COLORS, FONT_HEADLINE } = require('./layout');

function NewTaskEmail({ creatorName, taskTitle, wgName, actionUrl }) {
  return e(EmailLayout, { wgName },
    e(Heading, { style: { fontFamily: FONT_HEADLINE, fontSize: '22px', color: COLORS.onSurface, margin: '0 0 12px' } },
      `Neue Aufgabe: "${taskTitle}"`),
    e(Text, { style: { color: COLORS.onSurface, fontSize: '15px', lineHeight: '22px', margin: '0 0 8px' } },
      `${creatorName} hat eine neue Aufgabe für die WG erstellt: "${taskTitle}".`),
    e(Text, { style: { color: COLORS.onSurfaceVariant, fontSize: '15px', lineHeight: '22px', margin: '0 0 24px' } },
      'Schau vorbei und übernimm sie, wenn du Zeit hast.'),
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
    }, 'Zu den Aufgaben')
  );
}

module.exports = NewTaskEmail;
