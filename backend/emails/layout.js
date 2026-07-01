const React = require('react');
const { Html, Head, Body, Container, Section } = require('@react-email/components');

const e = React.createElement;

function EmailLayout({ children }) {
  return e(Html, null,
    e(Head, null),
    e(Body, { style: { fontFamily: 'sans-serif', backgroundColor: '#f6f5f2', padding: '32px 0' } },
      e(Container, {
        style: {
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '480px'
        }
      },
        e(Section, null, children)
      )
    )
  );
}

module.exports = { EmailLayout, e };
