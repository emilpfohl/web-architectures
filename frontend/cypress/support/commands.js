// Custom commands for E2E tests
Cypress.Commands.add('apiRegister', (user) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/auth/register',
    body: user,
    failOnStatusCode: false
  })
})

Cypress.Commands.add('uiLogin', (email, password) => {
  cy.visit('/login')
  cy.get('input[type="email"]').clear().type(email)
  cy.get('input[type="password"]').clear().type(password)
  cy.contains('Anmelden').click()
})

// eslint-disable-next-line no-undef
module.exports = {}
